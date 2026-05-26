import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../config/env';
import * as schema from './schema';
import logger from '../config/logger';


export const pool = new Pool({
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,

  min: env.DB_POOL_MIN,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'PostgreSQL pool error');
});

// ─── Drizzle ORM Instance ─────────────────────────────────────────────────────
export const db = drizzle(pool, { schema });

// ─── Health Check ─────────────────────────────────────────────────────────────
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    logger.info('PostgreSQL connected');
    return true;
  } catch (err) {
    logger.error({ err }, 'PostgreSQL connection failed');
    return false;
  }
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
  logger.info('PostgreSQL pool closed');

}
