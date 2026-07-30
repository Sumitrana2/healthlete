import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(4041),
  API_PREFIX: z.string().default("/api/v1"),
  API_BASE_URL: z.string().default("http://loacalhost:4041"),

  // Database
  DB_HOST: z.string().default("127.0.0.1"),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().min(1, "DB_NAME is required"),
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
  DB_POOL_MIN: z.coerce.number().default(2),
  DB_POOL_MAX: z.coerce.number().default(10),

  // Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters"),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default("30d"),

  // Redis
  REDIS_URL: z.string().optional(),

  // AI
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  // Vendors
  HYPEAUDITOR_AUTH_TOKEN: z.string().optional(),
  HYPEAUDITOR_AUTH_ID: z.string().optional(),
  PHYLLO_CLIENT_ID: z.string().optional(),
  PHYLLO_CLIENT_SECRET: z.string().optional(),
  SPONSOR_UNITED_API_KEY: z.string().optional(),

  // AWS
  AWS_REGION: z.string().default("us-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET_NAME: z.string().optional(),

  // CORS
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000,http://localhost:4000"),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // EMAIL OTP
  OTP_LENGTH: z.coerce.number().int().min(4).max(10).default(6),
  OTP_EXPIRY_MINUTES: z.coerce.number().default(10),
  RESET_TOKEN_EXPIRY_MINUTES: z.coerce.number().default(10),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z.string().min(1),

  // REDIS
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
});

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(_parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = _parsed.data;
export type Env = typeof env;
