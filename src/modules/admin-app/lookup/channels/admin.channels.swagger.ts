import { registry } from "../../../../config/swagger";
import { z } from "zod";
import { successResponse, errorResponse } from "../../../../utils/swaggerSchemas";

const channelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

registry.registerPath({
  method: "get",
  path: "/admin/lookup/channels",
  tags: ["Admin Lookup Data"],
  summary: "Get all active preferred channels",
  responses: {
    200: {
      description: "Channels fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({ channels: z.array(channelSchema) })
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