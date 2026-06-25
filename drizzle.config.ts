import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();

export default {
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    ssl: false,
  },
  verbose: true,
  strict: true,
} satisfies Config;