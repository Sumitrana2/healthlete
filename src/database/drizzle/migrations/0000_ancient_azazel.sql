DO $$ BEGIN
 CREATE TYPE "public"."admin_role" AS ENUM('super_admin', 'admin', 'sub_admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."provider" AS ENUM('hyperauditor');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."athlete_sync_status" AS ENUM('pending', 'syncing', 'completed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."otp_purpose" AS ENUM('email_verify', 'forgot_password');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."platform" AS ENUM('instagram', 'youtube', 'twitter', 'tiktok');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."report_state" AS ENUM('not_synced', 'syncing', 'ready', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lookup_options" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"key" varchar(100) NOT NULL,
	"label" varchar(200) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_taxonomy_selections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"taxonomy_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "platform_taxonomy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" varchar(20) NOT NULL,
	"kind" varchar(20) NOT NULL,
	"external_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_languages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "athlete_languages_name_unique" UNIQUE("name"),
	CONSTRAINT "athlete_languages_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_approval_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"reviewed_by" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_campaign_objectives" (
	"brand_id" uuid NOT NULL,
	"campaign_objective_id" uuid NOT NULL,
	CONSTRAINT "brand_campaign_objectives_brand_id_campaign_objective_id_pk" PRIMARY KEY("brand_id","campaign_objective_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_health_conditions" (
	"brand_id" uuid NOT NULL,
	"health_condition_id" uuid NOT NULL,
	CONSTRAINT "brand_health_conditions_brand_id_health_condition_id_pk" PRIMARY KEY("brand_id","health_condition_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_preferred_channels" (
	"brand_id" uuid NOT NULL,
	"channel_id" uuid NOT NULL,
	CONSTRAINT "brand_preferred_channels_brand_id_channel_id_pk" PRIMARY KEY("brand_id","channel_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brand_required_languages" (
	"brand_id" uuid NOT NULL,
	"language_id" uuid NOT NULL,
	CONSTRAINT "brand_required_languages_brand_id_language_id_pk" PRIMARY KEY("brand_id","language_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"password_hash" varchar(255),
	"role" varchar(100),
	"company_id" uuid,
	"onboarding_step" integer DEFAULT 1 NOT NULL,
	"is_onboarding_complete" boolean DEFAULT false,
	"is_email_verified" boolean DEFAULT false,
	"approval_status" "approval_status" DEFAULT 'pending',
	"reviewed_by" uuid,
	"reviewed_at" timestamp,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "brands_slug_unique" UNIQUE("slug"),
	CONSTRAINT "brands_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "campaign_objectives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_objectives_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"website" varchar(255),
	"logo_url" varchar(500),
	"description" text,
	"country" varchar(100),
	"industry_id" uuid,
	"company_size_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_sizes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_sizes_label_unique" UNIQUE("label")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "health_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "health_conditions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "industries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"slug" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "industries_name_unique" UNIQUE("name"),
	CONSTRAINT "industries_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "preferred_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "preferred_channels_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "auth_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"email" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "otp_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid,
	"email" varchar(255) NOT NULL,
	"otp_hash" varchar(255) NOT NULL,
	"purpose" "otp_purpose" NOT NULL,
	"attempts" integer DEFAULT 0,
	"is_used" boolean DEFAULT false,
	"expires_at" timestamp NOT NULL,
	"reset_token" varchar(255),
	"reset_token_expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"device_info" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "social_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"brand_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(200) NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" "admin_role" DEFAULT 'admin' NOT NULL,
	"is_super_admin" boolean DEFAULT false NOT NULL,
	"permissions" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"failed_login_attempts" integer DEFAULT 0,
	"locked_until" timestamp,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_slug_unique" UNIQUE("slug"),
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_auth_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"email" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"status" varchar(20) NOT NULL,
	"ip" varchar(45),
	"user_agent" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_otp_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid,
	"email" varchar(255) NOT NULL,
	"otp_hash" varchar(255) NOT NULL,
	"purpose" "otp_purpose" NOT NULL,
	"attempts" integer DEFAULT 0,
	"is_used" boolean DEFAULT false,
	"reset_token" varchar(255),
	"reset_token_expires_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"device_info" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_refresh_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athletes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"avatar_url" text,
	"country" varchar(2),
	"country_name" varchar(100),
	"languages" jsonb,
	"emails" jsonb,
	"description" text,
	"is_description_added" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true,
	"categories" jsonb,
	"health_conditions" jsonb,
	"personalHealthConnections" jsonb,
	"gender" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "athletes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_platform_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"provider" "provider" DEFAULT 'hyperauditor' NOT NULL,
	"platform" "platform" NOT NULL,
	"provider_social_id" varchar(255),
	"username" varchar(255),
	"profile_url" text,
	"avatar_url" text,
	"display_title" varchar(255),
	"subscribers_count" integer,
	"is_verified" boolean DEFAULT false NOT NULL,
	"report_state" "report_state" DEFAULT 'not_synced' NOT NULL,
	"raw_data" jsonb,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"provider" "provider" NOT NULL,
	"sync_status" "athlete_sync_status" DEFAULT 'pending' NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ap_unique" UNIQUE("athlete_id","provider")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instagram_raw_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instagram_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"er_score" numeric(5, 2),
	"comment_score" numeric(5, 2),
	"sentiment_score" numeric(5, 2),
	"spread_score" numeric(5, 2),
	"consistency_score" numeric(5, 2),
	"resonance_score" numeric(5, 2),
	"credibility_score" numeric(5, 2),
	"audience_trust_score" numeric(5, 2),
	"condition_alignment_score" numeric(5, 2),
	"platform_weight_applied" numeric(5, 2),
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "youtube_raw_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "youtube_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"er_score" numeric(5, 2),
	"comment_score" numeric(5, 2),
	"sentiment_score" numeric(5, 2),
	"spread_score" numeric(5, 2),
	"consistency_score" numeric(5, 2),
	"resonance_score" numeric(5, 2),
	"credibility_score" numeric(5, 2),
	"audience_trust_score" numeric(5, 2),
	"condition_alignment_score" numeric(5, 2),
	"platform_weight_applied" numeric(5, 2),
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "twitter_raw_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "twitter_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"er_score" numeric(5, 2),
	"comment_score" numeric(5, 2),
	"sentiment_score" numeric(5, 2),
	"spread_score" numeric(5, 2),
	"consistency_score" numeric(5, 2),
	"resonance_score" numeric(5, 2),
	"credibility_score" numeric(5, 2),
	"audience_trust_score" numeric(5, 2),
	"condition_alignment_score" numeric(5, 2),
	"platform_weight_applied" numeric(5, 2),
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tiktok_raw_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tiktok_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"link_id" uuid NOT NULL,
	"er_score" numeric(5, 2),
	"comment_score" numeric(5, 2),
	"sentiment_score" numeric(5, 2),
	"spread_score" numeric(5, 2),
	"consistency_score" numeric(5, 2),
	"resonance_score" numeric(5, 2),
	"credibility_score" numeric(5, 2),
	"audience_trust_score" numeric(5, 2),
	"condition_alignment_score" numeric(5, 2),
	"platform_weight_applied" numeric(5, 2),
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_final_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"resonance_score" numeric(5, 2),
	"credibility_score" numeric(5, 2),
	"audience_trust_score" numeric(5, 2),
	"brand_safety_score" numeric(5, 2),
	"condition_alignment_score" numeric(5, 2),
	"healthlete_match_score" numeric(5, 2),
	"weight_distribution" jsonb,
	"score_breakdown" jsonb,
	"avg_engagement_rate" numeric(5, 2),
	"avg_likes" integer,
	"avg_comments" integer,
	"engagement_quality_score" numeric(5, 2),
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resonance_conditions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"is_active" boolean DEFAULT true,
	"keywords" jsonb,
	"hashtags" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "resonance_conditions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_resonance_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"resonance_condition_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"matched_in" jsonb,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "athlete_condition_unique" UNIQUE("athlete_id","resonance_condition_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app_settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_taxonomy_selections" ADD CONSTRAINT "brand_taxonomy_selections_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_taxonomy_selections" ADD CONSTRAINT "brand_taxonomy_selections_taxonomy_id_platform_taxonomy_id_fk" FOREIGN KEY ("taxonomy_id") REFERENCES "public"."platform_taxonomy"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_approval_logs" ADD CONSTRAINT "brand_approval_logs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_campaign_objectives" ADD CONSTRAINT "brand_campaign_objectives_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_campaign_objectives" ADD CONSTRAINT "brand_campaign_objectives_campaign_objective_id_campaign_objectives_id_fk" FOREIGN KEY ("campaign_objective_id") REFERENCES "public"."campaign_objectives"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_health_conditions" ADD CONSTRAINT "brand_health_conditions_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_health_conditions" ADD CONSTRAINT "brand_health_conditions_health_condition_id_health_conditions_id_fk" FOREIGN KEY ("health_condition_id") REFERENCES "public"."health_conditions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_preferred_channels" ADD CONSTRAINT "brand_preferred_channels_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_preferred_channels" ADD CONSTRAINT "brand_preferred_channels_channel_id_preferred_channels_id_fk" FOREIGN KEY ("channel_id") REFERENCES "public"."preferred_channels"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_required_languages" ADD CONSTRAINT "brand_required_languages_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brand_required_languages" ADD CONSTRAINT "brand_required_languages_language_id_athlete_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."athlete_languages"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "brands" ADD CONSTRAINT "brands_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companies" ADD CONSTRAINT "companies_industry_id_industries_id_fk" FOREIGN KEY ("industry_id") REFERENCES "public"."industries"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "companies" ADD CONSTRAINT "companies_company_size_id_company_sizes_id_fk" FOREIGN KEY ("company_size_id") REFERENCES "public"."company_sizes"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "auth_logs" ADD CONSTRAINT "auth_logs_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "otp_verifications" ADD CONSTRAINT "otp_verifications_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "social_providers" ADD CONSTRAINT "social_providers_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_auth_logs" ADD CONSTRAINT "admin_auth_logs_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_otp_verifications" ADD CONSTRAINT "admin_otp_verifications_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_platform_links" ADD CONSTRAINT "athlete_platform_links_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_providers" ADD CONSTRAINT "athlete_providers_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instagram_raw_data" ADD CONSTRAINT "instagram_raw_data_link_id_athlete_platform_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."athlete_platform_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instagram_scores" ADD CONSTRAINT "instagram_scores_link_id_athlete_platform_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."athlete_platform_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "youtube_raw_data" ADD CONSTRAINT "youtube_raw_data_link_id_athlete_platform_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."athlete_platform_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "youtube_scores" ADD CONSTRAINT "youtube_scores_link_id_athlete_platform_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."athlete_platform_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "twitter_raw_data" ADD CONSTRAINT "twitter_raw_data_link_id_athlete_platform_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."athlete_platform_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "twitter_scores" ADD CONSTRAINT "twitter_scores_link_id_athlete_platform_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."athlete_platform_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tiktok_raw_data" ADD CONSTRAINT "tiktok_raw_data_link_id_athlete_platform_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."athlete_platform_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tiktok_scores" ADD CONSTRAINT "tiktok_scores_link_id_athlete_platform_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."athlete_platform_links"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_final_scores" ADD CONSTRAINT "athlete_final_scores_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_resonance_scores" ADD CONSTRAINT "athlete_resonance_scores_athlete_id_athletes_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athletes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_resonance_scores" ADD CONSTRAINT "athlete_resonance_scores_resonance_condition_id_resonance_conditions_id_fk" FOREIGN KEY ("resonance_condition_id") REFERENCES "public"."resonance_conditions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lookup_type_idx" ON "lookup_options" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lookup_type_key_idx" ON "lookup_options" USING btree ("type","key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bts_brand_idx" ON "brand_taxonomy_selections" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bts_taxonomy_idx" ON "brand_taxonomy_selections" USING btree ("taxonomy_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bts_unique_idx" ON "brand_taxonomy_selections" USING btree ("brand_id","taxonomy_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "taxonomy_platform_kind_idx" ON "platform_taxonomy" USING btree ("platform","kind");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "taxonomy_unique_idx" ON "platform_taxonomy" USING btree ("platform","kind","external_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bal_brand_idx" ON "brand_approval_logs" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bco_brand_idx" ON "brand_campaign_objectives" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bhc_brand_idx" ON "brand_health_conditions" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bpc_brand_idx" ON "brand_preferred_channels" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brl_brand_idx" ON "brand_required_languages" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brands_email_idx" ON "brands" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brands_slug_idx" ON "brands" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brands_approval_idx" ON "brands" USING btree ("approval_status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brands_company_idx" ON "brands" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "brands_onboarding_idx" ON "brands" USING btree ("onboarding_step");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_name_idx" ON "companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_industry_idx" ON "companies" USING btree ("industry_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "al_brand_idx" ON "auth_logs" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "al_email_idx" ON "auth_logs" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "al_created_at_idx" ON "auth_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_email_idx" ON "otp_verifications" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "otp_purpose_idx" ON "otp_verifications" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rt_brand_idx" ON "refresh_tokens" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "rt_token_idx" ON "refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sp_provider_idx" ON "social_providers" USING btree ("provider","provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sp_brand_idx" ON "social_providers" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admins_email_idx" ON "admins" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admins_slug_idx" ON "admins" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admins_super_admin_idx" ON "admins" USING btree ("is_super_admin");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aal_admin_idx" ON "admin_auth_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aal_email_idx" ON "admin_auth_logs" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "aal_created_at_idx" ON "admin_auth_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_otp_email_idx" ON "admin_otp_verifications" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_otp_purpose_idx" ON "admin_otp_verifications" USING btree ("purpose");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "art_admin_idx" ON "admin_refresh_tokens" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "art_token_idx" ON "admin_refresh_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "athletes_slug_idx" ON "athletes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "athletes_country_idx" ON "athletes" USING btree ("country");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apl_athlete_idx" ON "athlete_platform_links" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apl_platform_idx" ON "athlete_platform_links" USING btree ("platform");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apl_username_idx" ON "athlete_platform_links" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "apl_social_id_idx" ON "athlete_platform_links" USING btree ("provider_social_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "athlete_platform_unique" ON "athlete_platform_links" USING btree ("athlete_id","platform");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "provider_social_unique" ON "athlete_platform_links" USING btree ("provider","platform","provider_social_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ap_athlete_id_idx" ON "athlete_providers" USING btree ("athlete_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instagram_raw_link_idx" ON "instagram_raw_data" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instagram_score_link_idx" ON "instagram_scores" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "youtube_raw_link_idx" ON "youtube_raw_data" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "youtube_score_link_idx" ON "youtube_scores" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "twitter_raw_link_idx" ON "twitter_raw_data" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "twitter_score_link_idx" ON "twitter_scores" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tiktok_raw_link_idx" ON "tiktok_raw_data" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tiktok_score_link_idx" ON "tiktok_scores" USING btree ("link_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "afs_athlete_idx" ON "athlete_final_scores" USING btree ("athlete_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "afs_athlete_unique" ON "athlete_final_scores" USING btree ("athlete_id");