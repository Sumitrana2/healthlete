import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const loginSchema = z
  .object({
    email: z.string().email().openapi({ example: "admin@healthlete.com" }),
    password: z.string().min(1).openapi({ example: "Admin@1234" }),
  })
  .openapi("AdminLoginBody");

export const forgotPasswordSchema = z
  .object({
    email: z.string().email().openapi({ example: "admin@healthlete.com" }),
  })
  .openapi("AdminForgotPasswordBody");

export const verifyResetOtpSchema = z
  .object({
    email: z.string().email().openapi({ example: "admin@healthlete.com" }),
    otp: z.string().length(6).openapi({ example: "123456" }),
  })
  .openapi("AdminVerifyResetOtpBody");

export const resetPasswordSchema = z
  .object({
    email: z.string().email().openapi({ example: "admin@healthlete.com" }),
    resetToken: z.string().min(1).openapi({ example: "reset-token-from-verify-otp" }),
    newPassword: z
      .string()
      .min(8, "Must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character")
      .openapi({ example: "NewAdmin@1234" }),
  })
  .openapi("AdminResetPasswordBody");

export const resendOtpSchema = z
  .object({
    email: z.string().email().openapi({ example: "admin@healthlete.com" }),
    purpose: z
      .enum(["email_verify", "forgot_password"])
      .openapi({ example: "forgot_password" }),
  })
  .openapi("AdminResendOtpBody");
