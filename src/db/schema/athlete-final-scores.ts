import {
  pgTable,
  uuid,
  decimal,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { athletes } from "./athletes";

export const athleteFinalScores = pgTable(
  "athlete_final_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athletes.id, { onDelete: "cascade" }),

    resonanceScore: decimal("resonance_score", { precision: 5, scale: 2 }),   
    credibilityScore: decimal("credibility_score", { precision: 5, scale: 2 }),
    audienceTrustScore: decimal("audience_trust_score", { precision: 5, scale: 2 }),
    brandOverSafetyScore: decimal("brand_safety_score", { precision: 5, scale: 2 }),
    
    conditionAlignmentScore: decimal("condition_alignment_score", { precision: 5, scale: 2 }),
    healthleteMatchScore: decimal("healthlete_match_score", { precision: 5, scale: 2 }),

    weightDistribution: jsonb("weight_distribution"),  
    scoreBreakdown: jsonb("score_breakdown"),        

    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    athleteIdx: index("afs_athlete_idx").on(table.athleteId),
    athleteUnique: uniqueIndex("afs_athlete_unique").on(table.athleteId),
  })
);