import {
  pgTable,
  uuid,
  varchar,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export const resonanceConditions = pgTable("resonance_conditions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull().unique(),
  isActive: boolean("is_active").default(true),
  keywords: jsonb("keywords").$type<string[]>(),
  hashtags: jsonb("hashtags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
