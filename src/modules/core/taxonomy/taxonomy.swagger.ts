import { registry } from "../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
} from "../../../utils/swaggerSchemas";

const taxonomyItemSchema = z.object({
  id: z.number(),
  title: z.string(),
});

const taxonomyListResponseSchema = successResponse(
  z.object({
    list: z.array(taxonomyItemSchema),
  })
);

registry.registerPath({
  method: "get",
  path: "/common/taxonomy",
  tags: ["Taxonomy"],
  summary: "Get taxonomy list — categories or interests by platform",
  description:
    "Without query parameters, the full taxonomy will be returned. Both platform and kind are required to get a filtered list.",

  request: {
    query: z.object({
      platform: z
        .enum(["ig", "yt"])
        .optional()
        .describe("Platform: ig | yt"),

      kind: z
        .enum(["category", "interest"])
        .optional()
        .describe("Kind: category | interest"),
    }),
  },

  responses: {
    200: {
      description: "Taxonomy list",
      content: {
        "application/json": {
          schema: taxonomyListResponseSchema,
        },
      },
    },

    400: {
      description: "Invalid platform or kind",
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
  },
});