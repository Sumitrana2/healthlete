import { registry } from "../../../config/swagger";
import { z } from "zod";
import {
  errorResponse,
  paginationResponse,
  successResponse,
  paginationQuery,
} from "../../../utils/swaggerSchemas";
import { AthleteSchema } from "../../admin-app/athlete/admin.athlete.schema";

const AthleteListSchema = paginationResponse.extend({
  items: z.array(AthleteSchema),
});

registry.registerPath({
  method: "get",
  path: "/brand/athletes",
  tags: ["Brand Athletes"],
  summary: "List athletes",
  request: {
    query: z.object({
      search: z.string().optional().describe("Search by first or last name"),
      healthConditionIds: z
        .string()
        .optional()
        .describe("Comma separated health condition UUIDs"),
      includeHealthConditions: z
        .enum(["true", "false"])
        .optional()
        .describe("Include health conditions in response"),
      ...paginationQuery.shape,
    }),
  },
  responses: {
    200: {
      description: "Athletes fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(AthleteListSchema),
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
  method: "get",
  path: "/brand/athletes/{id}",
  tags: ["Brand Athletes"],
  summary: "Get athlete by id",
  request: {
    params: z.object({
      id: z.string().uuid().describe("Athlete ID"),
    }),
  },
  responses: {
    200: {
      description: "Athlete fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(AthleteSchema),
        },
      },
    },
    404: { description: "Athlete not found" },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});