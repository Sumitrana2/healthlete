import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  boolean
} from "drizzle-orm/pg-core";
export const athletes = pgTable(
  "athletes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 255 }).notNull(),
    lastName: varchar("last_name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    country: varchar("country", { length: 100 }),
    description: text("description"),        
    avatarUrl: text("avatar_url"),           
    tags: text("tags").array(),   
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("athletes_slug_idx").on(table.slug),
    countryIdx: index("athletes_country_idx").on(table.country),
  })
);
