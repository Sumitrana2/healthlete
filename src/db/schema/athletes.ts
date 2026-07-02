import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";

import { athleteSyncStatusEnum } from "./enums";

export const athletes = pgTable(
  "athletes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    fullName: varchar("full_name", { length: 255 }).notNull(),

    slug: varchar("slug", { length: 255 }).notNull().unique(),

    country: varchar("country", { length: 100 }),

    healthConditions: text("health_conditions").array(),

    tags: text("tags").array(),

    syncStatus: athleteSyncStatusEnum("sync_status")
      .default("pending")
      .notNull(),

    lastSyncedAt: timestamp("last_synced_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("athletes_slug_idx").on(table.slug),

    countryIdx: index("athletes_country_idx").on(table.country),

    syncStatusIdx: index("athletes_sync_status_idx").on(table.syncStatus),
  })
);
