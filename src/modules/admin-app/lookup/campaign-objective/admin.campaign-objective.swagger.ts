import { registry } from "../../../../config/swagger";
import { z } from "zod";
import { successResponse, errorResponse } from "../../../../utils/swaggerSchemas";

const campaignObjectiveSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

registry.registerPath({
  method: "get",
  path: "/admin/lookup/campaign-objectives",
  tags: ["Admin Lookup Data"],
  summary: "Get all active campaign objectives",
  responses: {
    200: {
      description: "Campaign objectives fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({ campaignObjectives: z.array(campaignObjectiveSchema) })
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