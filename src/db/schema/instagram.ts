import {
  pgTable,
  uuid,
  jsonb,
  timestamp,
  decimal,
  index,
} from "drizzle-orm/pg-core";

import { athletePlatformLinks } from "./athlete-platform-links";

export const instagramRawData = pgTable(
  "instagram_raw_data",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    linkId: uuid("link_id")
      .notNull()
      .references(() => athletePlatformLinks.id, {
        onDelete: "cascade",
      }),

    payload: jsonb("payload").notNull(),

    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  },
  (table) => ({
    linkIdx: index("instagram_raw_link_idx").on(table.linkId),
  })
);

export const instagramScores = pgTable(
  "instagram_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    linkId: uuid("link_id")
      .notNull()
      .references(() => athletePlatformLinks.id, {
        onDelete: "cascade",
      }),

    erScore: decimal("er_score", {
      precision: 5,
      scale: 2,
    }),

    commentScore: decimal("comment_score", {
      precision: 5,
      scale: 2,
    }),

    sentimentScore: decimal("sentiment_score", {
      precision: 5,
      scale: 2,
    }),

    spreadScore: decimal("spread_score", {
      precision: 5,
      scale: 2,
    }),

    consistencyScore: decimal("consistency_score", {
      precision: 5,
      scale: 2,
    }),

    resonanceScore: decimal("resonance_score", {
      precision: 5,
      scale: 2,
    }),

    credibilityScore: decimal("credibility_score", {
      precision: 5,
      scale: 2,
    }),

    audienceTrustScore: decimal("audience_trust_score", {
      precision: 5,
      scale: 2,
    }),

    conditionAlignmentScore: decimal("condition_alignment_score", {
      precision: 5,
      scale: 2,
    }),

    platformWeightApplied: decimal("platform_weight_applied", {
      precision: 5,
      scale: 2,
    }),

    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  },
  (table) => ({
    linkIdx: index("instagram_score_link_idx").on(table.linkId),
  })
);
