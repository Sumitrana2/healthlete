import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { admins } from "./admins";
import { otpPurposeEnum } from "./enums";

export const adminOtpVerifications = pgTable(
  "admin_otp_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").references(() => admins.id, {
      onDelete: "cascade",
    }),
    email: varchar("email", { length: 255 }).notNull(),
    otpHash: varchar("otp_hash", { length: 255 }).notNull(),
    purpose: otpPurposeEnum("purpose").notNull(),
    attempts: integer("attempts").default(0),
    isUsed: boolean("is_used").default(false),
    resetToken: varchar("reset_token", { length: 255 }),
    resetTokenExpiresAt: timestamp("reset_token_expires_at"),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("admin_otp_email_idx").on(t.email),
    purposeIdx: index("admin_otp_purpose_idx").on(t.purpose),
  })
);

export const adminRefreshTokens = pgTable(
  "admin_refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id")
      .notNull()
      .references(() => admins.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    deviceInfo: jsonb("device_info").$type<{
      ip?: string;
      userAgent?: string;
    }>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    adminIdx: index("art_admin_idx").on(t.adminId),
    tokenIdx: index("art_token_idx").on(t.token),
  })
);

export const adminAuthLogs = pgTable(
  "admin_auth_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").references(() => admins.id, {
      onDelete: "set null",
    }),
    email: varchar("email", { length: 255 }).notNull(),
    action: varchar("action", { length: 50 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    ip: varchar("ip", { length: 45 }),
    userAgent: text("user_agent"),
    details: jsonb("details"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (t) => ({
    adminIdx: index("aal_admin_idx").on(t.adminId),
    emailIdx: index("aal_email_idx").on(t.email),
    createdAtIdx: index("aal_created_at_idx").on(t.createdAt),
  })
);
