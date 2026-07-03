import { registry } from "../../../../config/swagger";
import { z } from "zod";
import { successResponse, errorResponse } from "../../../../utils/swaggerSchemas";

const industrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  // slug: z.string(),
});

registry.registerPath({
  method: "get",
  path: "/admin/lookup/industries",
  tags: ["Admin Lookup Data"],
  summary: "Get all active industries",
  responses: {
    200: {
      description: "Industries fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({ industries: z.array(industrySchema) })
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