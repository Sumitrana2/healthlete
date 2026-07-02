import { registry } from "../../../config/swagger";
import { z } from "zod";

const adminResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(["super_admin", "admin", "sub_admin"]),
  isSuperAdmin: z.boolean(),
});

const messageResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.null(),
});

registry.registerPath({
  method: "post",
  path: "/admin/auth/login",
  tags: ["Admin Auth"],
  summary: "Admin login with email and password",
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
            message: z.string(),
            data: z.object({ admin: adminResponseSchema }),
          }),
        },
      },
    },
    401: { description: "Invalid credentials" },
    423: { description: "Account locked" },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/auth/forgot-password",
  tags: ["Admin Auth"],
  summary: "Request password reset OTP",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({ email: z.string().email() }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "OTP sent if account exists",
      content: { "application/json": { schema: messageResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/auth/verify-reset-otp",
  tags: ["Admin Auth"],
  summary: "Verify password reset OTP",
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
      description: "OTP verified — reset token issued",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.object({ resetToken: z.string() }),
          }),
        },
      },
    },
    400: { description: "Invalid or expired OTP" },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/auth/reset-password",
  tags: ["Admin Auth"],
  summary: "Reset password using reset token",
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
  path: "/admin/auth/resend-otp",
  tags: ["Admin Auth"],
  summary: "Resend OTP",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            
            purpose: z.enum(["forgot_password", "email_verify"]),
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
  path: "/admin/auth/refresh",
  tags: ["Admin Auth"],
  summary: "Refresh access token",
  description: "A new access token will be generated using the refresh token cookie.",
  responses: {
    200: {
      description: "Token refreshed",
      content: { "application/json": { schema: messageResponseSchema } },
    },
    401: { description: "Invalid or expired refresh token" },
  },
});

registry.registerPath({
  method: "post",
  path: "/admin/auth/logout",
  tags: ["Admin Auth"],
  summary: "Logout — clears cookies and revokes refresh token",
  responses: {
    200: {
      description: "Logged out successfully",
      content: { "application/json": { schema: messageResponseSchema } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/auth/me",
  tags: ["Admin Auth"],
  summary: "Verify token and get current admin info",
  responses: {
    200: {
      description: "Authenticated",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            message: z.string(),
            data: z.object({
              id: z.string().uuid(),
              email: z.string().email(),
              type: z.literal("admin"),
            }),
          }),
        },
      },
    },
    401: { description: "No token or invalid token" },
  },
});
