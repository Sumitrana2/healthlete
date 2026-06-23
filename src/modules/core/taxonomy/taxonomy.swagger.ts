import { registry } from "../../../config/swagger";
import { z } from "zod";

const taxonomyItemSchema = z.object({
  id:    z.number(),
  title: z.string(),
});

registry.registerPath({
  method:  "get",
  path:    "/common/taxonomy",
  tags:    ["Taxonomy"],
  summary: "Get taxonomy list — categories or interests by platform",
  description: "Without query parameters, the full taxonomy will be returned. Both platform and kind are required to get a filtered list.",
  request: {
    query: z.object({
      platform: z.enum(['ig', 'yt']).optional().describe("Platform: ig | yt"),
      kind:     z.enum(['category', 'interest']).optional().describe("Kind: category | interest"),
    }),
  },
  responses: {
    200: {
      description: "Taxonomy list",
      content: {
        "application/json": {
          schema: z.union([
            z.object({
              success: z.literal(true),
              data:    z.array(taxonomyItemSchema),
            }),
            z.object({
              success: z.literal(true),
              data: z.object({
                ig: z.object({
                  categories: z.array(taxonomyItemSchema),
                  interests:  z.array(taxonomyItemSchema),
                }),
                yt: z.object({
                  categories: z.array(taxonomyItemSchema),
                }),
              }),
            }),
          ]),
        },
      },
    },
    400: { description: "Invalid platform or kind" },
  },
});