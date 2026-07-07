import { registry } from "../../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  paginationQuery,
  paginationResponse,
} from "../../../../utils/swaggerSchemas";
import { companySchema, createCompanySchema, updateCompanySchema } from "./admin.company.schema";

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
      isActive: z.enum(["true", "false"]).optional().describe("Filter by status"),
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

registry.registerPath({
  method: "patch",
  path: "/admin/lookup/company/{id}",
  tags: ["Admin Lookup Data"],
  summary: "Update company",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Company ID"),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: updateCompanySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Company updated successfully",
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
      description: "Company or Industry not found",
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
  method: "delete",
  path: "/admin/lookup/company/{id}",
  tags: ["Admin Lookup Data"],
  summary: "Delete company",

  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },

  responses: {
    200: {
      description: "Company deleted successfully",
      content: {
        "application/json": {
          schema: successResponse(companySchema),
        },
      },
    },

    404: {
      description: "Company not found",
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