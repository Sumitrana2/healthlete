import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const createCompanySchema = z
  .object({
    name: z.string().trim().min(1).max(255).openapi({ example: "Acme Health" }),
    website: z.string().max(255).optional(),
    logoUrl: z.string().max(500).optional(),
    description: z.string().max(2000).optional(),
    country: z.string().max(100).optional(),
    industryId: z.string().uuid().optional(),
    companySizeId: z.string().uuid().optional(),
  })
  .openapi("CreateCompanyBody");

export const updateCompanySchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    website: z.string().max(255).optional().nullable(),
    logoUrl: z.string().max(500).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    country: z.string().max(100).optional().nullable(),
    industryId: z.string().uuid().optional().nullable(),
    companySizeId: z.string().uuid().optional().nullable(),
  })
  .openapi("UpdateCompanyBody");
