import { registry } from "../../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  paginationQuery,
  paginationResponse,
} from "../../../../utils/swaggerSchemas";
import { createIndustrySchema, industrySchema, updateIndustrySchema } from "./admin.industries.schema";

const ListSchema = z.object({
  item: z.array(industrySchema),
  ...paginationResponse.shape,
});


registry.registerPath({
  method: "post",
  path: "/admin/lookup/industries",
  tags: ["Admin Lookup Data"],
  summary: "Create industry",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createIndustrySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Industry created successfully",
      content: {
        "application/json": {
          schema: successResponse(industrySchema),
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
    409: {
      description: "Industry already exists",
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
  path: "/admin/lookup/industries",
  tags: ["Admin Lookup Data"],
  summary: "Get all active industries",
  request: {
    query: z.object({
      search: z.string().optional().describe("Search by name"),
      isActive: z.enum(["true", "false"]).optional().describe("Filter by status"),
      ...paginationQuery.shape,
    }),
  },
  responses: {
    200: {
      description: "Industries fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(
              ListSchema,
          ),
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
  path: "/admin/lookup/industries/{id}",
  tags: ["Admin Lookup Data"],
  summary: "Update industry",
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: updateIndustrySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Industry updated successfully",
      content: {
        "application/json": {
          schema: successResponse(industrySchema),
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
      description: "Industry already exists",
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