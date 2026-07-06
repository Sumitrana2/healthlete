import { registry } from "../../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  paginationQuery,
  paginationResponse,
} from "../../../../utils/swaggerSchemas";

const createHealthConditionSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(100)
    .trim()
    .describe("Health condition name"),
});

const healthConditionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});


const ListSchema = z.object({
  item: z.array(healthConditionSchema),
  ...paginationResponse.shape,
});

registry.registerPath({
  method: "post",
  path: "/admin/lookup/health-conditions",
  tags: ["Admin Lookup Data"],
  summary: "Create health condition",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createHealthConditionSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Health condition created successfully",
      content: {
        "application/json": {
          schema: successResponse(healthConditionSchema),
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
      description: "Health condition already exists",
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
  path: "/admin/lookup/health-conditions",
  tags: ["Admin Lookup Data"],
  summary: "Get all active health conditions",
  request: {
    query: z.object({
      search: z.string().optional().describe("Search by name"),
      isActive: z.enum(["true", "false"]).optional().describe("Filter by status"),
      ...paginationQuery.shape,
    }),
  },
  responses: {
    200: {
      description: "Health conditions fetched successfully",
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