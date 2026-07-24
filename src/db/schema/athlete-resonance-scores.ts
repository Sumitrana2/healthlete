// db/schema/athlete-resonance-scores.ts
import { pgTable, uuid, integer, jsonb, timestamp, unique } from "drizzle-orm/pg-core";
import { athletes } from "./athletes";
import { resonanceConditions } from "./resonance-conditions";

export const athleteResonanceScores = pgTable(
  "athlete_resonance_scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athletes.id, { onDelete: "cascade" }),
    resonanceConditionId: uuid("resonance_condition_id")
      .notNull()
      .references(() => resonanceConditions.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    matchedIn: jsonb("matched_in"),
    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueConstraint: unique("athlete_condition_unique").on(
      table.athleteId,
      table.resonanceConditionId
    ),
  })
);