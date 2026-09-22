import pg from 'pg';

const { Pool } = pg;

export function createPool(config) {
  const options = config.connectionString
    ? { connectionString: config.connectionString }
    : {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
      };

  return new Pool({
    ...options,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });
}

export class Database {
  constructor(pool) {
    this.pool = pool;
  }

  query(text, values) {
    return this.pool.query(text, values);
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('begin');
      const result = await callback(client);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback').catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  }

  end() {
    return this.pool.end();
  }
}
