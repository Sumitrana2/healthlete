import { registry } from "../../../config/swagger";
import { z } from "zod";

const profileResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    // id: z.string().uuid(),
    // email: z.string().email(),
    // firstName: z.string(),
    // lastName: z.string(),
    // companyName: z.string(),
    // role: z.string().nullable().optional(),
    // approvalStatus: z.enum(["pending", "approved", "rejected"]),
    // isEmailVerified: z.boolean(),
    // lastLoginAt: z.string().datetime().nullable().optional(),
    // createdAt: z.string().datetime(),
  }),
});

registry.registerPath({
  method: "get",
  path: "/brand/profile/me",
  tags: ["Brand Profile"],
  summary: "Get logged-in brand profile",
  description: "Returns the profile of the authenticated brand.",
  security: [
    {
      cookieAuth: [],
    },
  ],
  responses: {
    200: {
      description: "Profile fetched successfully",
      content: {
        "application/json": {
          schema: profileResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
    },
  },
});