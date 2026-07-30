import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const createLanguageSchema = z
  .object({
    name: z.string().trim().min(1).max(100).openapi({ example: "English" }),
    code: z.string().trim().min(2).max(10).openapi({ example: "en" }),
    isActive: z.boolean().optional().default(true),
  })
  .openapi("CreateLanguageBody");

export const updateLanguageSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    code: z.string().trim().min(2).max(10).optional(),
    isActive: z.boolean().optional(),
  })
  .openapi("UpdateLanguageBody");
