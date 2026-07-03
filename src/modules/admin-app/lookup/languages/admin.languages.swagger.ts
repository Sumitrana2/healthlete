import { registry } from "../../../../config/swagger";
import { z } from "zod";
import { successResponse, errorResponse } from "../../../../utils/swaggerSchemas";

const languageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
});

registry.registerPath({
  method: "get",
  path: "/admin/lookup/languages",
  tags: ["Admin Lookup Data"],
  summary: "Get all active athlete languages",
  responses: {
    200: {
      description: "Languages fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({ languages: z.array(languageSchema) })
          ),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: { "application/job": { schema: errorResponse } },
    },
  },
});