import { env } from "./env";

export const appConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  apiBaseUrl: env.API_BASE_URL,
  allowedOrigins: env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()),
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },
} as const;
