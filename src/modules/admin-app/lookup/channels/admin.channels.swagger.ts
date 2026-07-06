import { registry } from "../../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
  paginationQuery,
  paginationResponse,
} from "../../../../utils/swaggerSchemas";
import { channelSchema, createChannelsSchema, updatePreferredChannelSchema } from "./admin.channels.schema";




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
          schema: createChannelsSchema,
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

registry.registerPath({
  method: "patch",
  path: "/admin/lookup/channels/{id}",
  tags: ["Admin Lookup Data"],
  summary: "Update preferred channel",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Preferred Channel ID"),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: updatePreferredChannelSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Preferred channel updated successfully",
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
    404: {
      description: "Preferred channel not found",
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