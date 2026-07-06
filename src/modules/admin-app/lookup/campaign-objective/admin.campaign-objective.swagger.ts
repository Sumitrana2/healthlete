import { registry } from "../../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  paginationQuery,
  paginationResponse,
} from "../../../../utils/swaggerSchemas";

const campaignObjectiveSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const createCampaignObjectiveSchema = z.object({
  name: z.string().trim().min(2).max(150).describe("Campaign objective name"),
});

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
