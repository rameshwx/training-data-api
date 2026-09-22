import { buildApp } from './app.js';
import { getConfig } from './config.js';
import { Database, createPool } from './db/client.js';

const config = getConfig();
const db = new Database(createPool(config.pg));
const app = buildApp({ db, config });

const shutdown = async (signal) => {
  app.log.info({ signal }, 'Shutting down');
  await app.close();
  await db.end();
  process.exit(0);
};

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);

try {
  await app.listen({ host: '0.0.0.0', port: config.port });
} catch (error) {
  app.log.error(error);
  await db.end();
  process.exit(1);
}
