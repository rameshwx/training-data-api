import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import openapi from '../openapi.json' with { type: 'json' };
import { AppError, databaseError } from './errors.js';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// The supplied snapshot uses deterministic UUID-like identifiers whose version
// and variant nibbles are zero, so validate the UUID shape without enforcing
// RFC 4122 version/variant bits.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const catalogColumns = new Map([
  ['id', 'item.id'],
  ['sku', 'item.sku'],
  ['name', 'item.name'],
  ['description', 'item.description'],
  ['category_slug', 'category.slug as category_slug'],
  ['category_name', 'category.name as category_name'],
  ['unit', 'item.unit'],
  ['price_cents', 'item.price_cents'],
  ['image_url', 'item.image_url'],
  ['is_active', 'item.is_active'],
]);
const riderColumns = new Map([
  ['id', 'rider.id'],
  ['display_name', 'rider.display_name'],
  ['vehicle_type', 'rider.vehicle_type'],
  ['service_area', 'rider.service_area'],
  ['availability', 'rider.availability'],
]);

function selectedColumns(query, allowed, fallback) {
  const raw = typeof query.select === 'string' && query.select.length > 0
    ? query.select.split(',').map((column) => column.trim())
    : fallback;
  if (raw.length === 0 || raw.some((column) => !allowed.has(column))) {
    throw new AppError(400, 'INVALID_SELECT', 'The select parameter contains an unsupported column.');
  }
  return raw;
}

function withImageUrl(row, config) {
  if (typeof row.image_url === 'string' && row.image_url.startsWith('/')) {
    return { ...row, image_url: `${config.publicBaseUrl}${row.image_url}` };
  }
  return row;
}

function parseQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new AppError(400, 'INVALID_QUANTITY', 'quantity must be an integer between 1 and 100.');
  }
  return quantity;
}

function parseUuid(value, field) {
  if (typeof value !== 'string' || !UUID_RE.test(value)) {
    throw new AppError(400, 'INVALID_INPUT', `${field} must be a valid UUID.`);
  }
  return value;
}

function nonEmptyText(value, field, min, max) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (text.length < min || text.length > max) {
    throw new AppError(400, 'INVALID_INPUT', `${field} must contain ${min} to ${max} characters.`);
  }
  return text;
}

function optionalText(value, field, max) {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const text = String(value).trim();
  if (text.length > max) throw new AppError(400, 'INVALID_INPUT', `${field} must not exceed ${max} characters.`);
  return text;
}

function requireApiKey(request, config) {
  const supplied = request.headers['x-api-key'] ?? request.headers.apikey;
  if (!config.apiKey || typeof supplied !== 'string') {
    throw new AppError(401, 'UNAUTHORIZED', 'A valid API key is required.');
  }
  const expected = Buffer.from(config.apiKey);
  const actual = Buffer.from(supplied);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) {
    throw new AppError(401, 'UNAUTHORIZED', 'A valid API key is required.');
  }
}

function mapPostgresError(error) {
  if (error instanceof AppError) return error;
  if (error?.code === '23505') return new AppError(409, 'CONFLICT', 'The requested record already exists.');
  if (error?.code === '22P02') return new AppError(400, 'INVALID_INPUT', 'One or more input values are invalid.');
  return databaseError(error);
}

export function buildApp({ db, config }) {
  const app = Fastify({ logger: config.nodeEnv === 'test' ? false : true });

  app.register(fastifyStatic, {
    root: path.join(root, 'public', 'assets'),
    prefix: '/assets/',
    decorateReply: false,
  });

  app.get('/health/live', async () => ({ status: 'ok' }));

  app.get('/health/ready', async (_request, reply) => {
    try {
      await db.query('select 1');
      return { status: 'ready' };
    } catch (error) {
      reply.code(503);
      return { status: 'not_ready' };
    }
  });

  app.get('/openapi.json', async () => openapi);

  app.get('/rest/v1/grocery_catalog', async (request) => {
    const columns = selectedColumns(request.query, catalogColumns, [
      'id', 'sku', 'name', 'description', 'category_slug', 'category_name',
      'unit', 'price_cents', 'image_url', 'is_active',
    ]);
    const where = request.query.is_active === 'eq.true'
      ? 'where item.is_active = true'
      : request.query.is_active === 'eq.false'
        ? 'where false'
        : '';
    const result = await db.query(
      `select ${columns.map((column) => catalogColumns.get(column)).join(', ')}
       from grocery_items item
       join grocery_categories category on category.id = item.category_id
       ${where}
       order by item.created_at, item.id`,
    );
    return result.rows.map((row) => withImageUrl(row, config));
  });

  app.get('/rest/v1/delivery_riders', async (request) => {
    const columns = selectedColumns(request.query, riderColumns, [
      'id', 'display_name', 'vehicle_type', 'service_area', 'availability',
    ]);
    const availability = request.query.availability === 'eq.available'
      ? "where rider.availability = 'available'"
      : '';
    const result = await db.query(
      `select ${columns.map((column) => riderColumns.get(column)).join(', ')}
       from delivery_riders rider
       ${availability}
       order by rider.display_name, rider.id`,
    );
    return result.rows;
  });

  app.post('/rest/v1/rpc/create_order_quote', async (request) => {
    requireApiKey(request, config);
    const body = request.body ?? {};
    const itemId = parseUuid(body.p_item_id, 'p_item_id');
    const quantity = parseQuantity(body.p_quantity);
    try {
      const result = await db.transaction(async (client) => {
        const itemResult = await client.query(
          `select item.id, item.name, item.price_cents, stock.quantity_available
           from grocery_items item
           join inventory stock on stock.grocery_item_id = item.id
           where item.id = $1 and item.is_active = true`,
          [itemId],
        );
        if (itemResult.rowCount === 0) {
          throw new AppError(404, 'ITEM_NOT_FOUND', 'Active grocery item not found.');
        }
        const item = itemResult.rows[0];
        if (item.quantity_available < quantity) {
          throw new AppError(409, 'INSUFFICIENT_INVENTORY', 'Insufficient inventory for requested quantity.');
        }
        const quoteResult = await client.query(
          `insert into order_quotes
             (grocery_item_id, quantity, unit_price_cents, total_cents, available_quantity)
           values ($1, $2, $3, $3 * $2, $4)
           returning id as quote_id, grocery_item_id as item_id, quantity,
                     available_quantity, unit_price_cents, total_cents, expires_at`,
          [itemId, quantity, item.price_cents, item.quantity_available],
        );
        return {
          ...quoteResult.rows[0],
          item_name: item.name,
        };
      });
      return [result];
    } catch (error) {
      throw mapPostgresError(error);
    }
  });

  app.post('/rest/v1/rpc/create_delivery_order', async (request) => {
    requireApiKey(request, config);
    const body = request.body ?? {};
    const quoteId = parseUuid(body.p_quote_id, 'p_quote_id');
    const customerName = nonEmptyText(body.p_customer_name, 'customer name', 2, 100);
    const deliveryAddress = nonEmptyText(body.p_delivery_address, 'delivery address', 8, 300);
    const customerNote = optionalText(body.p_customer_note, 'customer note', 300);

    try {
      const result = await db.transaction(async (client) => {
        const quoteResult = await client.query(
          `select quote.*, item.name as item_name, item.is_active
           from order_quotes quote
           join grocery_items item on item.id = quote.grocery_item_id
           where quote.id = $1
           for update`,
          [quoteId],
        );
        if (quoteResult.rowCount === 0) throw new AppError(404, 'QUOTE_NOT_FOUND', 'Quote not found.');
        const quote = quoteResult.rows[0];
        if (quote.consumed_at) throw new AppError(409, 'QUOTE_CONSUMED', 'Quote has already been used.');
        if (new Date(quote.expires_at) <= new Date()) throw new AppError(409, 'QUOTE_EXPIRED', 'Quote has expired.');
        if (!quote.is_active) throw new AppError(404, 'ITEM_NOT_FOUND', 'Quoted grocery item is no longer active.');

        const stockResult = await client.query(
          'select quantity_available from inventory where grocery_item_id = $1 for update',
          [quote.grocery_item_id],
        );
        if (stockResult.rowCount === 0 || stockResult.rows[0].quantity_available < quote.quantity) {
          throw new AppError(409, 'INSUFFICIENT_INVENTORY', 'Insufficient inventory for quoted quantity.');
        }

        await client.query(
          'update inventory set quantity_available = quantity_available - $1 where grocery_item_id = $2',
          [quote.quantity, quote.grocery_item_id],
        );
        const orderResult = await client.query(
          `insert into delivery_orders
             (order_reference, quote_id, grocery_item_id, quantity, unit_price_cents,
              total_cents, customer_name, delivery_address, customer_note, status)
           values
             ('GRO-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6)),
              $1, $2, $3, $4, $5, $6, $7, $8, 'pending_dispatch')
           returning id as order_id, order_reference, status, quote_id,
                     grocery_item_id as item_id, quantity, total_cents, created_at`,
          [quote.id, quote.grocery_item_id, quote.quantity, quote.unit_price_cents,
            quote.total_cents, customerName, deliveryAddress, customerNote],
        );
        await client.query('update order_quotes set consumed_at = now() where id = $1', [quote.id]);
        return { ...orderResult.rows[0], item_name: quote.item_name };
      });
      return [result];
    } catch (error) {
      throw mapPostgresError(error);
    }
  });

  app.setErrorHandler((error, _request, reply) => {
    const normalized = mapPostgresError(error);
    if (normalized instanceof AppError) {
      reply.code(normalized.statusCode).send({
        code: normalized.code,
        message: normalized.message,
        ...(normalized.details ? { details: normalized.details } : {}),
      });
      return;
    }
    app.log.error(normalized);
    reply.code(500).send({ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' });
  });

  return app;
}
