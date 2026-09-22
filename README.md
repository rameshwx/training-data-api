# Training Data API

Standalone PostgreSQL 17 and Node.js 22 API built from the supplied Supabase grocery-delivery migrations and database snapshot.

The API preserves the existing four-call workflow while removing the runtime dependency on Supabase. See [docs/API.md](docs/API.md) and [openapi.json](openapi.json) for the complete contract.

## Deployment

The production Compose stack contains a private PostgreSQL service and a public API service. Coolify owns `https://train.uxi.asia`; PostgreSQL has no public domain or host port. The API container applies idempotent migrations at startup under a PostgreSQL advisory lock.

Runtime secrets belong in Coolify:

- `PGPASSWORD`
- `API_KEY`
- `PUBLIC_BASE_URL=https://train.uxi.asia`

GitHub Actions uses encrypted repository or environment secrets only for deployment control:

- `COOLIFY_BASE_URL`
- `COOLIFY_API_TOKEN`
- `COOLIFY_RESOURCE_UUID`

The workflow runs tests and a Docker build on pull requests and `main`, then triggers Coolify only after the `main` checks pass.

## Source snapshot

The normalized migrations preserve the application data from `db_cluster-25-08-2026@22-34-26.backup.gz`: four categories, twelve products, twelve inventory rows, five riders, four historical orders, and three historical quotes. Supabase-only cluster objects are intentionally excluded.
