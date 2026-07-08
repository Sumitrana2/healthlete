import {
  pgTable,
  uuid,
  timestamp,
  index,
  unique
} from "drizzle-orm/pg-core";
import { athleteScoringProvider, athleteSyncStatusEnum } from "./enums";
import { athletes } from "./athletes";

export const athleteProviders = pgTable(
  "athlete_providers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athletes.id, { onDelete: "cascade" }),
    provider: athleteScoringProvider("provider").notNull(),
    syncStatus: athleteSyncStatusEnum("sync_status").default("pending").notNull(),
    lastSyncedAt: timestamp("last_synced_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    athleteIdIdx: index("ap_athlete_id_idx").on(table.athleteId),
    uniqueConstraint: unique("ap_unique").on(table.athleteId, table.provider),
  })
);