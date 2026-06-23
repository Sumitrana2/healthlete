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
