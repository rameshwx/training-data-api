import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';
import { getConfig } from '../src/config.js';
import { Database, createPool } from '../src/db/client.js';
import { migrate } from '../src/db/migrate.js';

const enabled = Boolean(process.env.TEST_DATABASE_URL || process.env.DATABASE_URL);

test('database snapshot and quote-to-order workflow', { skip: !enabled }, async (t) => {
  const config = getConfig({
    ...process.env,
    NODE_ENV: 'integration',
    DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    API_KEY: 'integration-api-key-with-more-than-20-chars',
    PUBLIC_BASE_URL: 'http://integration.local',
  });
  const pool = createPool(config.pg);
  const db = new Database(pool);
  await migrate(pool);
  const app = buildApp({ db, config });
  t.after(async () => {
    await app.close();
    await db.end();
  });

  const counts = await db.query(`
    select
      (select count(*) from grocery_categories) as categories,
      (select count(*) from grocery_items) as items,
      (select count(*) from inventory) as inventory,
      (select count(*) from delivery_riders) as riders,
      (select count(*) from delivery_orders) as orders,
      (select count(*) from order_quotes) as quotes
  `);
  assert.deepEqual(counts.rows[0], {
    categories: '4', items: '12', inventory: '12', riders: '5', orders: '4', quotes: '3',
  });

  const catalog = await app.inject({
    method: 'GET',
    url: '/rest/v1/grocery_catalog?select=id,name,image_url&is_active=eq.true',
  });
  assert.equal(catalog.statusCode, 200);
  assert.equal(catalog.json().length, 12);
  assert.match(catalog.json()[0].image_url, /^http:\/\/integration\.local\/assets\//);

  const headers = { 'x-api-key': config.apiKey, 'content-type': 'application/json' };
  const quote = await app.inject({
    method: 'POST',
    url: '/rest/v1/rpc/create_order_quote',
    headers,
    payload: JSON.stringify({ p_item_id: '10000000-0000-0000-0000-000000000002', p_quantity: 1 }),
  });
  if (quote.statusCode !== 200) console.error(`quote response: ${quote.body}`);
  assert.equal(quote.statusCode, 200, quote.body);
  const quoteRow = quote.json()[0];
  assert.equal(quoteRow.item_name, 'Cavendish Bananas');

  const order = await app.inject({
    method: 'POST',
    url: '/rest/v1/rpc/create_delivery_order',
    headers,
    payload: JSON.stringify({
      p_quote_id: quoteRow.quote_id,
      p_customer_name: 'Integration Test',
      p_delivery_address: '42 Palm Grove, Colombo 3',
    }),
  });
  assert.equal(order.statusCode, 200, order.body);
  assert.equal(order.json()[0].status, 'pending_dispatch');

  const duplicate = await app.inject({
    method: 'POST',
    url: '/rest/v1/rpc/create_delivery_order',
    headers,
    payload: JSON.stringify({
      p_quote_id: quoteRow.quote_id,
      p_customer_name: 'Integration Test',
      p_delivery_address: '42 Palm Grove, Colombo 3',
    }),
  });
  assert.equal(duplicate.statusCode, 409);
  assert.equal(duplicate.json().code, 'QUOTE_CONSUMED');

  const expired = await app.inject({
    method: 'POST',
    url: '/rest/v1/rpc/create_delivery_order',
    headers,
    payload: JSON.stringify({
      p_quote_id: 'ca98729b-44e7-4be4-8957-cc5b4c5a02db',
      p_customer_name: 'Integration Test',
      p_delivery_address: '42 Palm Grove, Colombo 3',
    }),
  });
  assert.equal(expired.statusCode, 409);
  assert.equal(expired.json().code, 'QUOTE_EXPIRED');
});
