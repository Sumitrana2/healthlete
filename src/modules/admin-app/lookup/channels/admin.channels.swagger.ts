import { registry } from "../../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  paginationQuery,
  paginationResponse,
} from "../../../../utils/swaggerSchemas";

const channelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const createPreferredChannelSchema = z.object({
  name: z.string().trim().min(2).max(150).describe("Preferred channel name"),
});

const ListSchema = z.object({
  item: z.array(channelSchema),
  ...paginationResponse.shape,
});

registry.registerPath({
  method: "post",
  path: "/admin/lookup/channels",
  tags: ["Admin Lookup Data"],
  summary: "Create preferred channel",
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: createPreferredChannelSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Preferred channel created successfully",
      content: {
        "application/json": {
          schema: successResponse(channelSchema),
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
      description: "Preferred channel already exists",
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
  path: "/admin/lookup/channels",
  tags: ["Admin Lookup Data"],
  summary: "Get all preferred channels",
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
      description: "Channels fetched successfully",
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
