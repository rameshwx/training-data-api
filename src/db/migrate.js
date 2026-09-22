import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { getConfig } from '../config.js';
import { createPool } from './client.js';

const { Pool } = pg;
const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const migrationsDirectory = join(root, 'db', 'migrations');
const lockKey = 7462381901;

async function migrationFiles() {
  return (await readdir(migrationsDirectory))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort();
}

export async function migrate(pool) {
  await pool.query(`
    create table if not exists schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  await pool.query('select pg_advisory_lock($1)', [lockKey]);
  try {
    for (const file of await migrationFiles()) {
      const version = file.split('_', 1)[0];
      const alreadyApplied = await pool.query(
        'select 1 from schema_migrations where version = $1',
        [version],
      );
      if (alreadyApplied.rowCount > 0) continue;

      const sql = await readFile(join(migrationsDirectory, file), 'utf8');
      const client = await pool.connect();
      try {
        await client.query('begin');
        await client.query(sql);
        await client.query('insert into schema_migrations (version) values ($1)', [version]);
        await client.query('commit');
        console.log(`Applied migration ${file}`);
      } catch (error) {
        await client.query('rollback').catch(() => {});
        throw new Error(`Migration ${file} failed: ${error.message}`, { cause: error });
      } finally {
        client.release();
      }
    }
  } finally {
    await pool.query('select pg_advisory_unlock($1)', [lockKey]);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = getConfig();
  const pool = createPool(config.pg);
  try {
    await migrate(pool);
  } finally {
    await pool.end();
  }
}
