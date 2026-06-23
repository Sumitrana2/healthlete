import { registry } from "../../../config/swagger";
import { z } from "zod";

const messageResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ message: z.string() }),
});

const registerResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    brandId: z.string().uuid(),
    email: z.string().email(),
    message: z.string(),
  }),
});

const resetOtpResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({ resetToken: z.string() }),
});

registry.registerPath({
  method: "post",
  path: "/brand/auth/register",
  tags: ["Brand Auth"],
  summary: "Register a new brand account",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            password: z
              .string()
              .min(8, "Password must be at least 8 characters")
              .regex(/[A-Z]/, "Must contain at least one uppercase letter")
              .regex(/[a-z]/, "Must contain at least one lowercase letter")
              .regex(/[0-9]/, "Must contain at least one number")
              .regex(
                /[^A-Za-z0-9]/,
                "Must contain at least one special character"
              ),
            firstName: z.string().min(1),
            lastName: z.string().min(1),
            companyName: z.string().min(1),
            role: z.string().optional(),
            requestType: z.string().optional(),
            budgetRange: z.string().optional(),
            timeline: z.string().optional(),
            campaignGoal: z.string().optional(),
            campaignDescription: z.string().optional(),
            language: z.string().optional(),
            categoryIds: z
              .array(z.number())
              .optional()
              .describe(
                "IG category externalIds — backend will auto-match YT categories + interests by title"
              ),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Registration successful, OTP sent to email",
      content: { "application/json": { schema: registerResponseSchema } },
    },
    409: { description: "Email already registered" },
    400: { description: "Validation error" },
  },
});

registry.registerPath({
  method: "post",
  path: "/brand/auth/login",
  tags: ["Brand Auth"],
  summary: "Login with email and password",
  description:
    "Sets httpOnly access + refresh token cookies on success. Enforces dynamic session limit (oldest session auto-revoked if limit exceeded).",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            password: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful — tokens set as httpOnly cookies",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              brand: z.object({
                id: z.string().uuid(),
                email: z.string().email(),
                firstName: z.string(),
                lastName: z.string(),
                companyName: z.string(),
                approvalStatus: z.enum(["pending", "approved", "rejected"]),
              }),
            }),
          }),
        },
      },
    },
    401: { description: "Invalid credentials" },
    403: { description: "Email not verified, or approval pending/rejected" },
  },
});

registry.registerPath({
  method: "post",
  path: "/brand/auth/verify-email-otp",
  tags: ["Brand Auth"],
  summary: "Verify email using OTP sent during registration",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            otp: z.string().length(6),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful — tokens set as httpOnly cookies",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              brand: z.object({
                id: z.string().uuid(),
                email: z.string().email(),
                firstName: z.string(),
                lastName: z.string(),
                companyName: z.string(),
                approvalStatus: z.enum(["pending", "approved", "rejected"]),
              }),
            }),
          }),
        },
      },
    },
    401: { description: "Invalid credentials" },
    403: { description: "Email not verified, or approval pending/rejected" },
    400: { description: "Invalid or expired OTP" },

  },
//   responses: {
//     200: {
//       description: "Email verified, waiting for admin approval",
//       content: { "application/json": { schema: messageResponseSchema } },
//     },
//     400: { description: "Invalid or expired OTP" },
//   },
});

registry.registerPath({
  method: "post",
  path: "/brand/auth/resend-otp",
  tags: ["Brand Auth"],
  summary: "Resend OTP for email verification or password reset",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            purpose: z.enum(["email_verify", "forgot_password"]),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "OTP resent",
      content: { "application/json": { schema: messageResponseSchema } },
    },
    404: { description: "Account not found" },
  },
});

registry.registerPath({
  method: "post",
  path: "/brand/auth/forgot-password",
  tags: ["Brand Auth"],
  summary: "Request a password reset OTP",
  request: {
    body: {
      content: {
        "application/json": { schema: z.object({ email: z.string().email() }) },
      },
    },
  },
  responses: {
    200: {
      description: "OTP sent if account exists (generic message for security)",
      content: { "application/json": { schema: messageResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/brand/auth/verify-reset-otp",
  tags: ["Brand Auth"],
  summary: "Verify password reset OTP and receive a short-lived reset token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            otp: z.string().length(6),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "OTP verified, reset token issued",
      content: { "application/json": { schema: resetOtpResponseSchema } },
    },
    400: { description: "Invalid or expired OTP" },
  },
});

registry.registerPath({
  method: "post",
  path: "/brand/auth/reset-password",
  tags: ["Brand Auth"],
  summary: "Reset password using the reset token from verify-reset-otp",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            resetToken: z.string().min(1),
            newPassword: z.string().min(8),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Password reset successful",
      content: { "application/json": { schema: messageResponseSchema } },
    },
    400: { description: "Invalid or expired reset token" },
  },
});

registry.registerPath({
  method: "post",
  path: "/brand/auth/refresh",
  tags: ["Brand Auth"],
  summary: "Refresh access token using refresh token cookie",
  description:
    "A new access token and refresh token will be generated using the refresh token from the cookie. The old refresh token will be revoked.",
  responses: {
    200: {
      description: "Tokens refreshed — new cookies set",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({ message: z.string() }),
          }),
        },
      },
    },
    401: { description: "No refresh token or invalid/expired token" },
  },
});

registry.registerPath({
  method: "post",
  path: "/brand/auth/logout",
  tags: ["Brand Auth"],
  summary: "Logout — clears cookies and revokes refresh token",
  description:
    "Logout will still work even if the access token has expired — the cookies will be cleared.",
  responses: {
    200: {
      description: "Logged out successfully",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({ message: z.string() }),
          }),
        },
      },
    },
  },
});
