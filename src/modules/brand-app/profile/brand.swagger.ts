import { registry } from "../../../config/swagger";
import { z } from "zod";
import {
  successResponse,
  errorResponse,
} from "../../../utils/swaggerSchemas";

const profileResponseSchema = successResponse(
  z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    isOnboardingComplete: z.boolean(),
    // companyName: z.string(),
    approvalStatus: z.enum([
      "pending",
      "approved",
      "rejected",
    ]),
  })
);

registry.registerPath({
  method: "get",
  path: "/brand/profile/me",
  tags: ["Brand Profile"],
  summary: "Get logged-in brand profile",
  description: "Returns the profile of the authenticated brand.",
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
      content: {
        "application/json": {
          schema: errorResponse,
        },
      },
    },
  },
});