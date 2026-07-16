import { registry } from "../../../config/swagger";
import { z } from "zod";
import { AthleteSchema, createAthleteBodySchema, updateAthleteBodySchema } from "./admin.athlete.schema";
import {
  errorResponse,
  paginationResponse,
  successResponse,
  paginationQuery,
} from "../../../utils/swaggerSchemas";

const multipartSchema = createAthleteBodySchema.extend({
  image: z.any().openapi({
    type: "string",
    format: "binary",
    description: "Athlete avatar image",
  }),

  tags: z.string().openapi({
    example: '["fitness","gym"]',
    description: "JSON array or comma separated values",
  }),

  healthConditionIds: z.string().openapi({
    example: '["550e8400-e29b-41d4-a716-446655440000"]',
  }),
});


const updateMultipartSchema = updateAthleteBodySchema.extend({
  image: z.any().optional().openapi({
    type: "string",
    format: "binary",
    description: "Athlete avatar image (optional)",
  }),
  tags: z.string().optional().openapi({
    example: '["fitness","gym"]',
  }),
  healthConditionIds: z.string().optional().openapi({
    example: '["550e8400-e29b-41d4-a716-446655440000"]',
  }),
  
});

registry.registerPath({
  method: "post",
  path: "/admin/athletes",
  tags: ["Admin Athletes"],
  summary: "Create athlete",

  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: multipartSchema,
        },
      },
    },
  },

  responses: {
    201: {
      description: "Athlete created successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.object({
              id: z.string().uuid(),
              avatarUrl: z.string().nullable(),
            }),
          }),
        },
      },
    },

    400: {
      description: "Validation failed",
    },

    415: {
      description: "Invalid file type",
    },

    500: {
      description: "Internal server error",
    },
  },
});

const AthleteListSchema = paginationResponse.extend({
  items: z.array(AthleteSchema),
});

registry.registerPath({
  method: "get",
  path: "/admin/athletes",
  tags: ["Admin Athletes"],
  summary: "List athletes",
  request: {
    query: z.object({
      search: z.string().optional().describe("Search by first or last name"),
      isActive: z
        .enum(["true", "false"])
        .optional()
        .describe("Filter by active status"),
      healthConditionIds: z
        .string()
        .optional()
        .describe("Comma separated health condition UUIDs"),
      includeHealthConditions: z
        .enum(["true", "false"])
        .optional()
        .describe("Include health conditions in response"),
      ...paginationQuery.shape,
    }),
  },
  responses: {
    200: {
      description: "Athletes fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(AthleteListSchema),
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
  path: "/admin/athletes/{id}",
  tags: ["Admin Athletes"],
  summary: "Update athlete",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Athlete ID"),
    }),
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: updateMultipartSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Athlete updated successfully",
      content: {
        "application/json": {
          schema: successResponse(AthleteSchema),
        },
      },
    },
    400: { description: "Validation failed" },
    404: { description: "Athlete not found" },
    415: { description: "Invalid file type" },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/athletes/{id}",
  tags: ["Admin Athletes"],
  summary: "Delete athlete",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Athlete ID"),
    }),
  },
  responses: {
    200: {
      description: "Athlete deleted successfully",
      content: {
        "application/json": {
          schema: successResponse(z.null()),
        },
      },
    },
    404: { description: "Athlete not found" },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});