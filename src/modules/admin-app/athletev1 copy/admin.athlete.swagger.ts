import { registry } from "../../../config/swagger";
import { z } from "zod";
import {
  AthleteSchema,
  selectedPlatformSchema,
  syncAthleteBodySchema,
  updateAthleteBodySchema,
} from "./admin.athlete.schema";
import {
  errorResponse,
  paginationResponse,
  successResponse,
  paginationQuery,
} from "../../../utils/swaggerSchemas";

const updateMultipartSchema = updateAthleteBodySchema.extend({
  image: z.any().optional().openapi({
    type: "string",
    format: "binary",
    description: "Athlete avatar image (optional)",
  }),
  healthConditionIds: z.string().optional().openapi({
    example: '["550e8400-e29b-41d4-a716-446655440000"]',
  }),
});

// ---------- Search on HyperAuditor ----------

registry.registerPath({
  method: "get",
  path: "/admin/athletesv1/search",
  tags: ["Admin Athletes v1"],
  summary: "Search athlete profiles on HyperAuditor across platforms",
  request: {
    query: z.object({
      query: z.string().describe("Athlete name to search"),
    }),
  },
  responses: {
    200: {
      description: "Matching profiles fetched successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.object({
              results: z.array(selectedPlatformSchema),
            }),
          }),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

// ---------- Sync athlete (create new OR add platform to existing) ----------

registry.registerPath({
  method: "post",
  path: "/admin/athletesv1/sync",
  tags: ["Admin Athletes v1"],
  summary: "Sync a single platform profile — creates new athlete if athleteId is omitted, else adds platform to existing athlete",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: syncAthleteBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Athlete synced successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.object({
              result: AthleteSchema,
            }),
          }),
        },
      },
    },
    400: {
      description: "Validation failed / platform already linked to this athlete",
    },
    404: {
      description: "Athlete not found",
    },
    409: {
      description: "This platform profile is already linked to another athlete",
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

// ---------- List athletes ----------

const AthleteListSchema = paginationResponse.extend({
  items: z.array(AthleteSchema),
});

registry.registerPath({
  method: "get",
  path: "/admin/athletes",
  tags: ["Admin Athletes v1"],
  summary: "List athletes",
  request: {
    query: z.object({
      search: z.string().optional().describe("Search by full name"),
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

// ---------- Get athlete by id ----------

registry.registerPath({
  method: "get",
  path: "/admin/athletesv1/{id}",
  tags: ["Admin Athletes v1"],
  summary: "Get athlete by id",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Athlete ID"),
    }),
  },
  responses: {
    200: {
      description: "Athlete fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(AthleteSchema),
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

// ---------- Update athlete ----------

registry.registerPath({
  method: "patch",
  path: "/admin/athletesv1/{id}",
  tags: ["Admin Athletes v1"],
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

// ---------- Delete athlete ----------

registry.registerPath({
  method: "delete",
  path: "/admin/athletesv1/{id}",
  tags: ["Admin Athletes v1"],
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

registry.registerPath({
  method: "get",
  path: "/admin/athletesv1/search",
  tags: ["Admin Athletes v1"],
  summary: "Search athletes from HypeAuditor",
  description:
    "Search athlete profiles using the HypeAuditor suggester API.",
  request: {
    query: z.object({
      query: z
        .string()
        .min(1)
        .describe("Athlete name to search")
        .openapi({
          example: "virat",
        }),
    }),
  },
  responses: {
    200: {
      description: "Profiles fetched successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.object({
              results: z.array(z.any()).openapi({
                description: "Profiles returned by HypeAuditor",
              }),
            }),
          }),
        },
      },
    },
    400: {
      description: "Search query is required",
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