import { z } from "zod";

export const createLanguageSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100),

  code: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .transform((v) => v.toUpperCase()),
});