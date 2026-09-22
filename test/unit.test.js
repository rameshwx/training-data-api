import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApp } from '../src/app.js';

const config = {
  nodeEnv: 'test',
  publicBaseUrl: 'http://test.local',
  apiKey: 'test-api-key-with-more-than-20-chars',
};

function fakeDb() {
  return {
    async query(sql) {
      if (sql.includes('select 1')) return { rows: [{ '?column?': 1 }], rowCount: 1 };
      if (sql.includes('from grocery_items')) {
        if (sql.includes('item.id, item.name, item.image_url')) {
          return {
            rowCount: 1,
            rows: [{
              id: '10000000-0000-0000-0000-000000000001',
              name: 'Royal Gala Apples',
              image_url: '/assets/grocery-images/royal-gala-apples.png',
            }],
          };
        }
        return {
          rowCount: 1,
          rows: [{
            id: '10000000-0000-0000-0000-000000000001',
            sku: 'PRO-APPLE-001',
            name: 'Royal Gala Apples',
            category_name: 'Fresh Produce',
            unit: '1 kg bag',
            price_cents: 690,
            image_url: '/assets/grocery-images/royal-gala-apples.png',
            is_active: true,
          }],
        };
      }
      if (sql.includes('from delivery_riders')) {
        return { rowCount: 1, rows: [{ display_name: 'Asha Perera', availability: 'available' }] };
      }
      throw new Error(`Unexpected fake query: ${sql}`);
    },
    async transaction() {
      throw new Error('transaction should not run in this unit test');
    },
  };
}

test('liveness and readiness endpoints respond', async (t) => {
  const app = buildApp({ db: fakeDb(), config });
  t.after(() => app.close());
  assert.equal((await app.inject({ method: 'GET', url: '/health/live' })).statusCode, 200);
  assert.equal((await app.inject({ method: 'GET', url: '/health/ready' })).statusCode, 200);
});

test('catalog expands local image URLs and preserves array response shape', async (t) => {
  const app = buildApp({ db: fakeDb(), config });
  t.after(() => app.close());
  const response = await app.inject({
    method: 'GET',
    url: '/rest/v1/grocery_catalog?select=id,name,image_url&is_active=eq.true',
  });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), [{
    id: '10000000-0000-0000-0000-000000000001',
    name: 'Royal Gala Apples',
    image_url: 'http://test.local/assets/grocery-images/royal-gala-apples.png',
  }]);
});

test('rider filtering returns an array', async (t) => {
  const app = buildApp({ db: fakeDb(), config });
  t.after(() => app.close());
  const response = await app.inject({
    method: 'GET',
    url: '/rest/v1/delivery_riders?availability=eq.available',
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.json()[0].availability, 'available');
});

test('mutation routes require the API key before touching the database', async (t) => {
  const app = buildApp({ db: fakeDb(), config });
  t.after(() => app.close());
  const response = await app.inject({
    method: 'POST',
    url: '/rest/v1/rpc/create_order_quote',
    payload: { p_item_id: '10000000-0000-0000-0000-000000000001', p_quantity: 1 },
  });
  assert.equal(response.statusCode, 401);
  assert.equal(response.json().code, 'UNAUTHORIZED');
});

test('quote validation rejects invalid quantity', async (t) => {
  const app = buildApp({ db: fakeDb(), config });
  t.after(() => app.close());
  const response = await app.inject({
    method: 'POST',
    url: '/rest/v1/rpc/create_order_quote',
    headers: { 'x-api-key': config.apiKey, 'content-type': 'application/json' },
    payload: JSON.stringify({ p_item_id: '10000000-0000-0000-0000-000000000001', p_quantity: 0 }),
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.json().code, 'INVALID_QUANTITY');
});

test('OpenAPI and image routes are available', async (t) => {
  const app = buildApp({ db: fakeDb(), config });
  t.after(() => app.close());
  const docs = await app.inject({ method: 'GET', url: '/openapi.json' });
  assert.equal(docs.statusCode, 200);
  assert.equal(docs.json().openapi, '3.1.0');
  const image = await app.inject({ method: 'GET', url: '/assets/grocery-images/royal-gala-apples.png' });
  assert.equal(image.statusCode, 200);
  assert.match(image.headers['content-type'], /^image\/png/);
});
