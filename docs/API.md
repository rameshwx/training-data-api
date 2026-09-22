# Training Data API

Base URL: `https://train.uxi.asia`

The API preserves the existing Supabase/PostgREST-shaped contract. Read requests are public. State-changing requests require `x-api-key`; `apikey` is accepted as a compatibility alias. Never commit the key.

## Health and documentation

### `GET /health/live`

Returns `200` when the Node process is running:

```json
{"status":"ok"}
```

### `GET /health/ready`

Checks PostgreSQL and returns `200` when it is reachable, otherwise `503`.

### `GET /openapi.json`

Returns the machine-readable OpenAPI document.

## Catalog

### `GET /rest/v1/grocery_catalog`

Returns catalog rows as a JSON array. The supported `select` fields are `id`, `sku`, `name`, `description`, `category_slug`, `category_name`, `unit`, `price_cents`, `image_url`, and `is_active`.

Example:

```sh
curl 'https://train.uxi.asia/rest/v1/grocery_catalog?select=id,sku,name,category_name,unit,price_cents,image_url&is_active=eq.true'
```

`image_url` points to `/assets/grocery-images/<filename>` on the deployed API.

### `GET /rest/v1/delivery_riders`

Returns rider rows as a JSON array. Use `availability=eq.available` to return only available riders.

```sh
curl 'https://train.uxi.asia/rest/v1/delivery_riders?select=id,display_name,vehicle_type,service_area,availability&availability=eq.available'
```

## Quote and order workflow

### `POST /rest/v1/rpc/create_order_quote`

Headers:

```text
x-api-key: <API_KEY>
Content-Type: application/json
```

Body:

```json
{
  "p_item_id": "10000000-0000-0000-0000-000000000001",
  "p_quantity": 2
}
```

Returns a one-element array containing `quote_id`, `item_id`, `item_name`, `quantity`, `available_quantity`, `unit_price_cents`, `total_cents`, and `expires_at`. Quotes lock the price for 10 minutes but do not reserve inventory.

### `POST /rest/v1/rpc/create_delivery_order`

Uses the quote ID and atomically locks inventory, decrements stock, creates the order, and consumes the quote.

Body:

```json
{
  "p_quote_id": "<quote_id>",
  "p_customer_name": "Sam Taylor",
  "p_delivery_address": "42 Palm Grove, Colombo 3",
  "p_customer_note": "Please ring the bell"
}
```

Returns a one-element array containing `order_id`, `order_reference`, `status`, `quote_id`, `item_id`, `item_name`, `quantity`, `total_cents`, and `created_at`. A quote can be consumed only once and must not be expired.

## Errors

Errors use a stable object shape:

```json
{"code":"QUOTE_EXPIRED","message":"Quote has expired."}
```

Typical statuses are `400` for invalid input, `401` for a missing/invalid mutation key, `404` for missing items or quotes, `409` for expired/consumed quotes or insufficient inventory, and `503` for readiness failure.

## Local development

```sh
cp .env.example .env
npm install
docker compose up --build
```

The local API listens on `http://localhost:8080`. PostgreSQL remains private to the Compose network.
