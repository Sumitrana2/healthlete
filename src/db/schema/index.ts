import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', ['admin', 'brand', 'athlete', 'viewer']);
export const athleteStatusEnum = pgEnum('athlete_status', ['active', 'inactive', 'pending', 'flagged']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'active', 'completed', 'cancelled']);
export const partnershipStatusEnum = pgEnum('partnership_status', ['requested', 'reviewing', 'approved', 'rejected', 'active', 'completed']);

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull().default('brand'),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  organizationName: varchar('organization_name', { length: 255 }),
  isEmailVerified: boolean('is_email_verified').default(false),
  isActive: boolean('is_active').default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  emailIdx: index('users_email_idx').on(t.email),
  roleIdx: index('users_role_idx').on(t.role),
}));

// ─── Athletes ─────────────────────────────────────────────────────────────────
export const athletes = pgTable('athletes', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 200 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 200 }),
  sport: varchar('sport', { length: 100 }),
  league: varchar('league', { length: 100 }),
  position: varchar('position', { length: 100 }),
  country: varchar('country', { length: 100 }),
  state: varchar('state', { length: 100 }),
  gender: varchar('gender', { length: 50 }),
  birthYear: integer('birth_year'),
  bio: text('bio'),
  profileImageUrl: varchar('profile_image_url', { length: 500 }),
  status: athleteStatusEnum('status').default('active'),
  // Health categories this athlete represents
  healthCategories: jsonb('health_categories').$type<string[]>().default([]),
  // Social handles
  instagramHandle: varchar('instagram_handle', { length: 150 }),
  twitterHandle: varchar('twitter_handle', { length: 150 }),
  tiktokHandle: varchar('tiktok_handle', { length: 150 }),
  youtubeHandle: varchar('youtube_handle', { length: 150 }),
  // Vendor IDs for integrations
  hypeauditorId: varchar('hypeauditor_id', { length: 100 }),
  phylloId: varchar('phyllo_id', { length: 100 }),
  sponsorUnitedId: varchar('sponsor_united_id', { length: 100 }),
  // Meta
  isVerified: boolean('is_verified').default(false),
  isFeatured: boolean('is_featured').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  slugIdx: index('athletes_slug_idx').on(t.slug),
  sportIdx: index('athletes_sport_idx').on(t.sport),
  statusIdx: index('athletes_status_idx').on(t.status),
  countryIdx: index('athletes_country_idx').on(t.country),
}));

// ─── Athlete Scores (HealthLete Score System) ─────────────────────────────────
export const athleteScores = pgTable('athlete_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  athleteId: uuid('athlete_id').notNull().references(() => athletes.id, { onDelete: 'cascade' }),
  // Core scores (0–100)
  resonanceScore: decimal('resonance_score', { precision: 5, scale: 2 }),
  credibilityScore: decimal('credibility_score', { precision: 5, scale: 2 }),
  trustScore: decimal('trust_score', { precision: 5, scale: 2 }),
  conditionAlignmentScore: decimal('condition_alignment_score', { precision: 5, scale: 2 }),
  reputationStabilityScore: decimal('reputation_stability_score', { precision: 5, scale: 2 }),
  audienceQualityScore: decimal('audience_quality_score', { precision: 5, scale: 2 }),
  // Composite / trademarked scores
  matchScore: decimal('match_score', { precision: 5, scale: 2 }),
  reputationRiskScore: decimal('reputation_risk_score', { precision: 5, scale: 2 }),
  pharmaComplianceScore: decimal('pharma_compliance_score', { precision: 5, scale: 2 }),
  audienceTrustScore: decimal('audience_trust_score', { precision: 5, scale: 2 }),
  // Score metadata
  scoreVersion: varchar('score_version', { length: 20 }).default('1.0'),
  scoreExplanation: jsonb('score_explanation').$type<Record<string, string>>(),
  computedAt: timestamp('computed_at').defaultNow().notNull(),
  validUntil: timestamp('valid_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  athleteIdx: index('athlete_scores_athlete_idx').on(t.athleteId),
  computedIdx: index('athlete_scores_computed_idx').on(t.computedAt),
}));

// ─── Brands ───────────────────────────────────────────────────────────────────
export const brands = pgTable('brands', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  industry: varchar('industry', { length: 100 }),
  healthCategories: jsonb('health_categories').$type<string[]>().default([]),
  logoUrl: varchar('logo_url', { length: 500 }),
  websiteUrl: varchar('website_url', { length: 500 }),
  isPharma: boolean('is_pharma').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── Campaigns ────────────────────────────────────────────────────────────────
export const campaigns = pgTable('campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  healthCategory: varchar('health_category', { length: 100 }),
  objectives: jsonb('objectives').$type<string[]>().default([]),
  budgetMin: decimal('budget_min', { precision: 12, scale: 2 }),
  budgetMax: decimal('budget_max', { precision: 12, scale: 2 }),
  targetAudience: jsonb('target_audience').$type<Record<string, unknown>>(),
  requiredPharmaCompliance: boolean('required_pharma_compliance').default(false),
  status: campaignStatusEnum('status').default('draft'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  brandIdx: index('campaigns_brand_idx').on(t.brandId),
  statusIdx: index('campaigns_status_idx').on(t.status),
}));

// ─── Partnerships ─────────────────────────────────────────────────────────────
export const partnerships = pgTable('partnerships', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id').notNull().references(() => campaigns.id),
  athleteId: uuid('athlete_id').notNull().references(() => athletes.id),
  brandId: uuid('brand_id').notNull().references(() => brands.id),
  status: partnershipStatusEnum('status').default('requested'),
  matchScoreAtRequest: decimal('match_score_at_request', { precision: 5, scale: 2 }),
  internalNotes: text('internal_notes'),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  campaignIdx: index('partnerships_campaign_idx').on(t.campaignId),
  athleteIdx: index('partnerships_athlete_idx').on(t.athleteId),
}));

// ─── Athlete Audience Snapshots ───────────────────────────────────────────────
export const audienceSnapshots = pgTable('audience_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  athleteId: uuid('athlete_id').notNull().references(() => athletes.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 50 }).notNull(), // instagram | tiktok | youtube | twitter
  followerCount: integer('follower_count'),
  engagementRate: decimal('engagement_rate', { precision: 5, scale: 4 }),
  audienceDemographics: jsonb('audience_demographics').$type<Record<string, unknown>>(),
  audienceAuthenticityScore: decimal('audience_authenticity_score', { precision: 5, scale: 2 }),
  topCountries: jsonb('top_countries').$type<string[]>(),
  ageBreakdown: jsonb('age_breakdown').$type<Record<string, number>>(),
  genderBreakdown: jsonb('gender_breakdown').$type<Record<string, number>>(),
  snapshotSource: varchar('snapshot_source', { length: 100 }), // hypeauditor | phyllo | manual
  snapshotAt: timestamp('snapshot_at').defaultNow().notNull(),
}, (t) => ({
  athletePlatformIdx: index('audience_snapshots_athlete_platform_idx').on(t.athleteId, t.platform),
}));

// ─── Relations ────────────────────────────────────────────────────────────────
export const athleteRelations = relations(athletes, ({ many }) => ({
  scores: many(athleteScores),
  audienceSnapshots: many(audienceSnapshots),
  partnerships: many(partnerships),
}));

export const brandRelations = relations(brands, ({ one, many }) => ({
  user: one(users, { fields: [brands.userId], references: [users.id] }),
  campaigns: many(campaigns),
  partnerships: many(partnerships),
}));

export const campaignRelations = relations(campaigns, ({ one, many }) => ({
  brand: one(brands, { fields: [campaigns.brandId], references: [brands.id] }),
  partnerships: many(partnerships),
}));
