import { pgEnum } from "drizzle-orm/pg-core";

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);
export const otpPurposeEnum = pgEnum("otp_purpose", [
  "email_verify",
  "forgot_password",
]);

export const adminRoleEnum = pgEnum("admin_role", [
  "super_admin",
  "admin",
  "sub_admin",
]);
