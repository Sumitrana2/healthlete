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
import { brands } from "./brands";
import { otpPurposeEnum } from "./enums";

export const otpVerifications = pgTable(
  "otp_verifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "cascade",
    }),
    email: varchar("email", { length: 255 }).notNull(),
    otpHash: varchar("otp_hash", { length: 255 }).notNull(),
    purpose: otpPurposeEnum("purpose").notNull(),
    attempts: integer("attempts").default(0),
    isUsed: boolean("is_used").default(false),
    expiresAt: timestamp("expires_at").notNull(),
    resetToken: varchar("reset_token", { length: 255 }),
    resetTokenExpiresAt: timestamp("reset_token_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("otp_email_idx").on(t.email),
    purposeIdx: index("otp_purpose_idx").on(t.purpose),
  })
);

export const socialProviders = pgTable(
  "social_providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerId: varchar("provider_id", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    providerIdx: index("sp_provider_idx").on(t.provider, t.providerId),
    brandIdx: index("sp_brand_idx").on(t.brandId),
  })
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
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
    brandIdx: index("rt_brand_idx").on(t.brandId),
    tokenIdx: index("rt_token_idx").on(t.token),
  })
);

export const authLogs = pgTable(
  "auth_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id").references(() => brands.id, {
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
    brandIdx: index("al_brand_idx").on(t.brandId),
    emailIdx: index("al_email_idx").on(t.email),
    createdAtIdx: index("al_created_at_idx").on(t.createdAt),
  })
);
