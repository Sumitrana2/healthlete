process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.PORT = process.env.PORT ?? "4041";
process.env.DB_HOST = process.env.DB_HOST ?? "127.0.0.1";
process.env.DB_PORT = process.env.DB_PORT ?? "5432";
process.env.DB_NAME = process.env.DB_NAME ?? "healthlete_test";
process.env.DB_USER = process.env.DB_USER ?? "postgres";
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? "password";
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? "test_jwt_secret_at_least_32_characters_long";
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ?? "test_refresh_secret_at_least_32_chars";
process.env.SMTP_HOST = process.env.SMTP_HOST ?? "smtp.test.local";
process.env.SMTP_PORT = process.env.SMTP_PORT ?? "587";
process.env.SMTP_USER = process.env.SMTP_USER ?? "test@test.local";
process.env.SMTP_PASSWORD = process.env.SMTP_PASSWORD ?? "password";
process.env.SMTP_FROM = process.env.SMTP_FROM ?? "noreply@test.local";
process.env.REDIS_HOST = process.env.REDIS_HOST ?? "127.0.0.1";
process.env.REDIS_PORT = process.env.REDIS_PORT ?? "6379";
