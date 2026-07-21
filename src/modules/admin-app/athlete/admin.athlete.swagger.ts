import { registry } from "../../../config/swagger";
import { z } from "zod";
import {
  AthleteSchema,
  selectedPlatformSchema,
  createAthleteBodySchema,
  addPlatformBodySchema,
  updateAthleteBodySchema,
  syncDataBodySchema,
} from "./admin.athlete.schema";
import {
  errorResponse,
  paginationResponse,
  successResponse,
  paginationQuery,
} from "../../../utils/swaggerSchemas";


const AthleteListSchema = paginationResponse.extend({
  items: z.array(AthleteSchema),
});


registry.registerPath({
  method: "get",
  path: "/admin/athletes/search",
  tags: ["Admin Athletes"],
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
              items: z.array(selectedPlatformSchema),
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


registry.registerPath({
  method: "get",
  path: "/admin/athletes/search-existing",
  tags: ["Admin Athletes"],
  summary: "Search existing athletes in DB by name (fuzzy match, for duplicacy check)",
  request: {
    query: z.object({
      name: z.string().describe("Athlete name to search in existing DB records"),
    }),
  },
  responses: {
    200: {
      description: "Similar athletes fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              results: z.array(AthleteSchema),
            })
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
  method: "post",
  path: "/admin/athletes",
  tags: ["Admin Athletes"],
  summary: "Create a new athlete by syncing a single platform profile from HyperAuditor",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createAthleteBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Athlete created successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              result: AthleteSchema,
            })
          ),
        },
      },
    },
    400: { description: "Validation failed" },
    409: { description: "This platform profile is already linked to another athlete" },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});


registry.registerPath({
  method: "post",
  path: "/admin/athletes/{id}/platforms",
  tags: ["Admin Athletes"],
  summary: "Add a new platform profile to an existing athlete",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Athlete ID"),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: addPlatformBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Platform added successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              result: AthleteSchema,
            })
          ),
        },
      },
    },
    400: { description: "Validation failed / platform already linked to this athlete" },
    404: { description: "Athlete not found" },
    409: { description: "This platform profile is already linked to another athlete" },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});




registry.registerPath({
  method: "get",
  path: "/admin/athletes",
  tags: ["Admin Athletes"],
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
      provider: z
        .string()
        .optional()
        .describe("Filter athletes linked to a specific provider (e.g. hypeauditor)"),
      includeHealthConditions: z
        .enum(["true", "false"])
        .optional()
        .describe("Include health conditions in response"),
      includePlatformLinks: z
        .enum(["true", "false"])
        .optional()
        .describe("Include linked platform profiles in response"),
      includeProviders: z
        .enum(["true", "false"])
        .optional()
        .describe("Include linked providers (sync status) in response"),
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
  method: "get",
  path: "/admin/athletes/{id}",
  tags: ["Admin Athletes"],
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


registry.registerPath({
  method: "patch",
  path: "/admin/athletes/{id}",
  tags: ["Admin Athletes"],
  summary: "Update athlete's description, health conditions, or active status",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Athlete ID"),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: updateAthleteBodySchema,
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

registry.registerPath({
  method: "delete",
  path: "/admin/athletes/{id}/platforms/{linkId}",
  tags: ["Admin Athletes"],
  summary: "Remove a platform link from an athlete",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Athlete ID"),
      linkId: z.string().uuid().describe("Platform Link ID"),
    }),
  },
  responses: {
    200: {
      description: "Platform removed successfully",
      content: {
        "application/json": {
          schema: successResponse(z.null()),
        },
      },
    },
    404: { description: "Athlete or platform link not found" },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/athletes/{id}/sync-data",
  tags: ["Admin Athletes"],
  summary: "Sync athlete's platform data (raw data + scores) from provider",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Athlete ID"),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: syncDataBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Athlete data sync completed",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.object({
              results: z.array(
                z.object({
                  platform: z.string(),
                  status: z.enum(["success", "failed"]),
                  data: z.any().optional(),
                  error: z.string().optional(),
                })
              ),
            }),
          }),
        },
      },
    },
    400: {
      description: "No platform links found for this athlete and provider",
    },
    404: {
      description: "Athlete not found",
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});