import { env } from "./env";

export const openaiConfig = {
  apiKey: env.OPENAI_API_KEY,
  anthropicApiKey: env.ANTHROPIC_API_KEY,
} as const;
