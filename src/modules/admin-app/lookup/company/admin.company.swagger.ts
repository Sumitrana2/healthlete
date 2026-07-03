import { registry } from "../../../../config/swagger";
import { z } from "zod";
import { successResponse, errorResponse } from "../../../../utils/swaggerSchemas";

const industrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
//   slug: z.string(),
}).nullable();

// const companySizeSchema = z.object({
//   id: z.string().uuid(),
//   label: z.string(),
// }).nullable();

const companySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  website: z.string().nullable(),
//   logoUrl: z.string().nullable(),
//   country: z.string().nullable(),
//   description: z.string().nullable(),
  industry: industrySchema,
//   companySize: companySizeSchema,
});

registry.registerPath({
  method: "get",
  path: "/admin/lookup/company",
  tags: ["Admin Lookup Data"],
  summary: "Get all companies list",
  responses: {
    200: {
      description: "Companies fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({ companies: z.array(companySchema) })
          ),
        },
      },
    },
    400: {
      description: "Validation error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});