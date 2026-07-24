import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { athletePlatformLinks } from "./athlete-platform-links";

export const athleteMedia = pgTable(
  "athlete_media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platformLinkId: uuid("platform_link_id")
      .notNull()
      .references(() => athletePlatformLinks.id, { onDelete: "cascade" }),
    externalMediaId: varchar("external_media_id", { length: 255 }).notNull(),
    mediaType: varchar("media_type", { length: 50 }),
    caption: text("caption"),
    thumbnailUrl: text("thumbnail_url"),
    postedAt: timestamp("posted_at"),
    likesCount: integer("likes_count"),
    commentsCount: integer("comments_count"),
    viewsCount: integer("views_count"),
    engagementRate: decimal("engagement_rate", { precision: 10, scale: 2 }),
    
    hashtags: jsonb("hashtags"),
    rawData: jsonb("raw_data"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    platformLinkIdx: index("am_platform_link_idx").on(table.platformLinkId),
    externalMediaUnique: uniqueIndex("am_external_media_unique").on(
      table.platformLinkId,
      table.externalMediaId
    ),
  })
);
