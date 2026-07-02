import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { athletes } from "./athletes";
import { platformEnum, reportStateEnum } from "./enums";

export const athletePlatformLinks = pgTable(
  "athlete_platform_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    athleteId: uuid("athlete_id")
      .notNull()
      .references(() => athletes.id, {
        onDelete: "cascade",
      }),

    platform: platformEnum("platform").notNull(),

    hyperauditSocialId: varchar("hyperaudit_social_id", {
      length: 255,
    }),

    username: varchar("username", {
      length: 255,
    }),

    profileUrl: text("profile_url"),

    displayTitle: varchar("display_title", {
      length: 255,
    }),

    subscribersCount: integer("subscribers_count"),

    isVerified: boolean("is_verified").default(false).notNull(),

    isPrimary: boolean("is_primary").default(false).notNull(),

    reportState: reportStateEnum("report_state").default("pending").notNull(),

    lastSyncedAt: timestamp("last_synced_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    athleteIdx: index("apl_athlete_idx").on(table.athleteId),

    platformIdx: index("apl_platform_idx").on(table.platform),

    usernameIdx: index("apl_username_idx").on(table.username),

    socialIdIdx: index("apl_social_id_idx").on(table.hyperauditSocialId),

    athletePlatformUnique: uniqueIndex("athlete_platform_unique").on(
      table.athleteId,
      table.platform
    ),
  })
);
