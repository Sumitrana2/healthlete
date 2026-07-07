import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  integer,
} from "drizzle-orm/pg-core";
import { approvalStatusEnum } from "./enums";
import { primaryKey } from "drizzle-orm/pg-core";

export const industries = pgTable("industries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  slug: varchar("slug", { length: 150 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const companySizes = pgTable("company_sizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: varchar("label", { length: 100 }).notNull().unique(), 
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const healthConditions = pgTable("health_conditions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignObjectives = pgTable("campaign_objectives", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const preferredChannels = pgTable("preferred_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const athleteLanguages = pgTable("athlete_languages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(), 
  code: varchar("code", { length: 10 }).notNull().unique(),  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    website: varchar("website", { length: 255 }),
    logoUrl: varchar("logo_url", { length: 500 }),
    description: text("description"),
    country: varchar("country", { length: 100 }),
    isActive: boolean("is_active").default(true),
    industryId: uuid("industry_id").references(() => industries.id, {
      onDelete: "set null",
    }),
    companySizeId: uuid("company_size_id").references(() => companySizes.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    nameIdx: index("companies_name_idx").on(t.name),
    industryIdx: index("companies_industry_idx").on(t.industryId),
  })
);


export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 200 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }),

    role: varchar("role", { length: 100 }),

    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    onboardingStep: integer("onboarding_step").default(1).notNull(),
    isOnboardingComplete: boolean("is_onboarding_complete").default(false),

    isEmailVerified: boolean("is_email_verified").default(false),
    approvalStatus: approvalStatusEnum("approval_status").default("pending"),
    reviewedBy: uuid("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),

    failedLoginAttempts: integer("failed_login_attempts").default(0),
    lockedUntil: timestamp("locked_until"),

    isActive: boolean("is_active").default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: index("brands_email_idx").on(t.email),
    slugIdx: index("brands_slug_idx").on(t.slug),
    statusIdx: index("brands_approval_idx").on(t.approvalStatus),
    companyIdx: index("brands_company_idx").on(t.companyId),
    onboardingIdx: index("brands_onboarding_idx").on(t.onboardingStep),
  })
);


export const brandHealthConditions = pgTable(
  "brand_health_conditions",
  {
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    healthConditionId: uuid("health_condition_id")
      .notNull()
      .references(() => healthConditions.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.brandId, t.healthConditionId] }),
    brandIdx: index("bhc_brand_idx").on(t.brandId),
  })
);

export const brandCampaignObjectives = pgTable(
  "brand_campaign_objectives",
  {
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    campaignObjectiveId: uuid("campaign_objective_id")
      .notNull()
      .references(() => campaignObjectives.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.brandId, t.campaignObjectiveId] }),
    brandIdx: index("bco_brand_idx").on(t.brandId),
  })
);

export const brandPreferredChannels = pgTable(
  "brand_preferred_channels",
  {
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    channelId: uuid("channel_id")
      .notNull()
      .references(() => preferredChannels.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.brandId, t.channelId] }),
    brandIdx: index("bpc_brand_idx").on(t.brandId),
  })
);

export const brandRequiredLanguages = pgTable(
  "brand_required_languages",
  {
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    languageId: uuid("language_id")
      .notNull()
      .references(() => athleteLanguages.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.brandId, t.languageId] }),
    brandIdx: index("brl_brand_idx").on(t.brandId),
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
