import { registry } from "../../../../config/swagger";
import { z } from "zod";
import { successResponse, errorResponse } from "../../../../utils/swaggerSchemas";

const healthConditionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

registry.registerPath({
  method: "get",
  path: "/admin/lookup/health-conditions",
  tags: ["Admin Lookup Data"],
  summary: "Get all active health conditions",
  responses: {
    200: {
      description: "Health conditions fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({ healthConditions: z.array(healthConditionSchema) })
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