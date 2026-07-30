import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
// import {
//   ROLES,
//   REQUEST_TYPES,
//   TIMELINES,
//   BUDGET_RANGES,
// } from "../../../common/constants/brand.constants";

extendZodWithOpenApi(z);

export const registerSchema = z
  .object({
    email: z.string().email().openapi({ example: "brand@example.com" }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character")
      .openapi({ example: "Test@1234" }),
    firstName: z.string().min(1).openapi({ example: "John" }),
    lastName: z.string().min(1).openapi({ example: "Doe" }),
  // companyName: z.string().min(1),
  // role: z.enum(ROLES).optional(),
  // requestType: z.enum(REQUEST_TYPES).optional(),
  // budgetRange: z.enum(BUDGET_RANGES).optional(),
  // timeline: z.enum(TIMELINES).optional(),
  // campaignGoal: z.string().optional(),
  // campaignDescription: z.string().optional(),
  // language: z.string().optional(),
  // categoryIds: z.array(z.number()).optional(),
  })
  .openapi("BrandRegisterBody");

export const verifyEmailOtpSchema = z
  .object({
    email: z.string().email().openapi({ example: "brand@example.com" }),
    otp: z.string().length(6).openapi({ example: "123456" }),
  })
  .openapi("BrandVerifyEmailOtpBody");

export const resendOtpSchema = z
  .object({
    email: z.string().email().openapi({ example: "brand@example.com" }),
    purpose: z
      .enum(["email_verify", "forgot_password"])
      .openapi({ example: "email_verify" }),
  })
  .openapi("BrandResendOtpBody");

export const forgotPasswordSchema = z
  .object({
    email: z.string().email().openapi({ example: "brand@example.com" }),
  })
  .openapi("BrandForgotPasswordBody");

export const verifyResetOtpSchema = z
  .object({
    email: z.string().email().openapi({ example: "brand@example.com" }),
    otp: z.string().length(6).openapi({ example: "123456" }),
  })
  .openapi("BrandVerifyResetOtpBody");

export const resetPasswordSchema = z
  .object({
    email: z.string().email().openapi({ example: "brand@example.com" }),
    resetToken: z.string().min(1).openapi({ example: "reset-token-from-verify-otp" }),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Must contain at least one special character")
      .openapi({ example: "NewTest@1234" }),
  })
  .openapi("BrandResetPasswordBody");

export const loginSchema = z
  .object({
    email: z.string().email().openapi({ example: "brand@example.com" }),
    password: z.string().min(1).openapi({ example: "Test@1234" }),
  })
  .openapi("BrandLoginBody");
