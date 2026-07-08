import { registry } from "../../../config/swagger";
import { z } from "zod";
import { createAthleteBodySchema } from "./admin.athlete.schema";

const multipartSchema = createAthleteBodySchema.extend({
  image: z.any().openapi({
    type: "string",
    format: "binary",
    description: "Athlete avatar image",
  }),

  tags: z.string().openapi({
    example: '["fitness","gym"]',
    description: "JSON array or comma separated values",
  }),

  healthConditionIds: z.string().openapi({
    example: '["550e8400-e29b-41d4-a716-446655440000"]',
  }),
});

registry.registerPath({
  method: "post",
  path: "/admin/athletes",
  tags: ["Admin Athletes"],
  summary: "Create athlete",

  request: {
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: multipartSchema,
        },
      },
    },
  },

  responses: {
    201: {
      description: "Athlete created successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.object({
              id: z.string().uuid(),
              avatarUrl: z.string().nullable(),
            }),
          }),
        },
      },
    },

    400: {
      description: "Validation failed",
    },

    415: {
      description: "Invalid file type",
    },

    500: {
      description: "Internal server error",
    },
  },
});
