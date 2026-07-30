import { env } from "./env";

export const hypeauditorConfig = {
  apiKey: env.HYPEAUDITOR_AUTH_TOKEN,
  authId: env.HYPEAUDITOR_AUTH_ID,
  baseUrl: "https://hypeauditor.com/api/method",
} as const;
