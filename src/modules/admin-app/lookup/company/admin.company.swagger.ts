import { registry } from "../../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  paginationQuery,
  paginationResponse,
} from "../../../../utils/swaggerSchemas";

const industrySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  })
  .nullable();


  const createCompanySchema = z.object({
    name: z
      .string()
      .min(2)
      .max(150)
      .trim()
      .describe("Company name"),
  
    website: z
      .string()
      .url()
      .optional()
      .describe("Company website"),
  
    industryId: z
      .string()
      .uuid()
      .describe("Industry ID"),
  });  

// const companySizeSchema = z.object({
//   id: z.string().uuid(),
//   label: z.string(),
// }).nullable();

const companySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  website: z.string().nullable(),
  // logoUrl: z.string().nullable(),
  // country: z.string().nullable(),
  // description: z.string().nullable(),
  industry: industrySchema,
  // companySize: companySizeSchema,
});

const companyListSchema = z.object({
  item: z.array(companySchema),
  ...paginationResponse.shape,
});

registry.registerPath({
  method: "post",
  path: "/admin/lookup/company",
  tags: ["Admin Lookup Data"],
  summary: "Create company",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createCompanySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Company created successfully",
      content: {
        "application/json": {
          schema: successResponse(companySchema),
        },
      },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
    404: {
      description: "Industry not found",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
    409: {
      description: "Company already exists",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
    500: {
      description: "Internal server error",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
  },
});


registry.registerPath({
  method: "get",
  path: "/admin/lookup/company",
  tags: ["Admin Lookup Data"],
  summary: "Get all companies",
  request: {
    query: z.object({
      search: z.string().optional().describe("Search by company name"),
      ...paginationQuery.shape,
    }),
  },
  responses: {
    200: {
      description: "Companies fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(companyListSchema),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});
