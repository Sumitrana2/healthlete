import { pgTable, uuid, timestamp, index, unique } from "drizzle-orm/pg-core";
import { athletes } from "./athletes";
import { healthConditions } from "./brands";


export const athleteHealthConditions = pgTable(
  "athlete_health_conditions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athletes.id, { onDelete: "cascade" }),
    healthConditionId: uuid("health_condition_id")
      .notNull()
      .references(() => healthConditions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    athleteIdIdx: index("ahc_athlete_id_idx").on(table.athleteId),
    uniqueConstraint: unique("ahc_unique").on(
      table.athleteId,
      table.healthConditionId
    ),
  })
);
