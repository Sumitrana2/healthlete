import { registry } from "../../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  paginationQuery,
  paginationResponse,
} from "../../../../utils/swaggerSchemas";
import { campaignObjectiveSchema, createCampaignObjectiveSchema, updateCampaignObjectiveSchema } from "./admin.campaign-objective.schema";

const ListSchema = z.object({
  item: z.array(campaignObjectiveSchema),
  ...paginationResponse.shape,
});

registry.registerPath({
  method: "post",
  path: "/admin/lookup/campaign-objectives",
  tags: ["Admin Lookup Data"],
  summary: "Create campaign objective",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createCampaignObjectiveSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Campaign objective created successfully",
      content: {
        "application/json": {
          schema: successResponse(campaignObjectiveSchema),
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
      description: "Campaign objective already exists",
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
  path: "/admin/lookup/campaign-objectives",
  tags: ["Admin Lookup Data"],
  summary: "Get all campaign objectives",
  request: {
    query: z.object({
      search: z.string().optional().describe("Search by name"),
      isActive: z
        .enum(["true", "false"])
        .optional()
        .describe("Filter by status"),
      ...paginationQuery.shape,
    }),
  },
  responses: {
    200: {
      description: "Campaign objectives fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(ListSchema),
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
  path: "/admin/lookup/campaign-objectives/{id}",
  tags: ["Admin Lookup Data"],
  summary: "Update campaign objective",

  request: {
    params: z.object({
      id: z.string().uuid(),
    }),

    body: {
      required: true,
      content: {
        "application/json": {
          schema: updateCampaignObjectiveSchema,
        },
      },
    },
  },

  responses: {
    200: {
      description: "Campaign objective updated successfully",
      content: {
        "application/json": {
          schema: successResponse(campaignObjectiveSchema),
        },
      },
    },
    404: {
      description: "Campaign objective not found",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
    409: {
      description: "Campaign objective already exists",
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
  path: "/admin/lookup/campaign-objectives/{id}",
  tags: ["Admin Lookup Data"],
  summary: "Delete campaign objective",

  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },

  responses: {
    200: {
      description: "Campaign objective deleted successfully",
      content: {
        "application/json": {
          schema: successResponse(campaignObjectiveSchema),
        },
      },
    },

    404: {
      description: "Campaign objective not found",
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
