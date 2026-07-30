import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const createNameLookupSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    isActive: z.boolean().optional().default(true),
  })
  .openapi("CreateNameLookupBody");

export const updateNameLookupSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    isActive: z.boolean().optional(),
  })
  .openapi("UpdateNameLookupBody");
