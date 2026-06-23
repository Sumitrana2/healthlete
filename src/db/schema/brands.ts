import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { approvalStatusEnum } from "./enums";

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),

    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),

    role: varchar("role", { length: 100 }),
    requestType: varchar("request_type", { length: 100 }),
    budgetRange: varchar("budget_range", { length: 100 }),
    timeline: varchar("timeline", { length: 100 }),

    campaignGoal: text("campaign_goal"),
    campaignDescription: text("campaign_description"),
    language: varchar("language", { length: 50 }),

    isEmailVerified: boolean("is_email_verified").default(false),
    approvalStatus: approvalStatusEnum("approval_status").default("pending"),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),

    isActive: boolean("is_active").default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("brands_email_idx").on(t.email),
    slugIdx: index("brands_slug_idx").on(t.slug),
    statusIdx: index("brands_approval_idx").on(t.approvalStatus),
  })
);

export const brandApprovalLogs = pgTable(
  "brand_approval_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    action: varchar("action", { length: 50 }).notNull(),
    reviewedBy: uuid("reviewed_by"),
    reason: text("reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    brandIdx: index("bal_brand_idx").on(t.brandId),
  })
);
