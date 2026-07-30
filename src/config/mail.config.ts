import { env } from "./env";

export const mailConfig = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  user: env.SMTP_USER,
  password: env.SMTP_PASSWORD,
  from: env.SMTP_FROM,
  otp: {
    length: env.OTP_LENGTH,
    expiryMinutes: env.OTP_EXPIRY_MINUTES,
  },
  resetTokenExpiryMinutes: env.RESET_TOKEN_EXPIRY_MINUTES,
} as const;
