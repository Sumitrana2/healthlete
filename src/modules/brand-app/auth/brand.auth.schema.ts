import { z } from "zod";
import {
  ROLES,
  REQUEST_TYPES,
  TIMELINES,
  BUDGET_RANGES,
} from "../../../constants/brand.constants";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[a-z]/, "Must contain at least one lowercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  companyName: z.string().min(1),
  role: z.enum(ROLES).optional(),
  requestType: z.enum(REQUEST_TYPES).optional(),
  budgetRange: z.enum(BUDGET_RANGES).optional(),
  timeline: z.enum(TIMELINES).optional(),
  campaignGoal: z.string().optional(),
  campaignDescription: z.string().optional(),
  language: z.string().optional(),
  categoryIds: z.array(z.number()).optional(),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const resendOtpSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["email_verify", "forgot_password"]),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const verifyResetOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  resetToken: z.string().min(1),
  newPassword: z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[a-z]/, "Must contain at least one lowercase letter")
  .regex(/[0-9]/, "Must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
