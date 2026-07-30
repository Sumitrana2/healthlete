import { env } from "./env";

export const databaseConfig = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  name: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  pool: {
    min: env.DB_POOL_MIN,
    max: env.DB_POOL_MAX,
  },
} as const;
