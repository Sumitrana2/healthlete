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

const ListSchema = z.object({
  data: z.array(channelSchema),
  ...paginationResponse.shape,
});

registry.registerPath({
  method: "get",
  path: "/admin/lookup/channels",
  tags: ["Admin Lookup Data"],
  summary: "Get all preferred channels",
  request: {
    query: z.object({
      search: z.string().optional().describe("Search by name"),
      isActive: z.enum(["true", "false"]).optional().describe("Filter by status"),
      ...paginationQuery.shape,
    }),
  },
  responses: {
    200: {
      description: "Channels fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              channels: ListSchema,
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