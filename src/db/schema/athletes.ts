import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  boolean,
  jsonb
} from "drizzle-orm/pg-core";
export const athletes = pgTable(
  "athletes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    country: varchar("country", { length: 2 }),
    countryName: varchar("country_name", { length: 100 }),
    languages: jsonb("languages"),
    emails: jsonb("emails"),
    description: text("description"),   
    isDescriptionAdded: boolean("is_description_added").default(false).notNull(),     
    avatarUrl: text("avatar_url"),           
    isActive: boolean("is_active").default(true),
    categories: jsonb("categories"),
    healthConditions: jsonb("health_conditions"),
    gender: varchar("gender", { length: 20 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("athletes_slug_idx").on(table.slug),
    countryIdx: index("athletes_country_idx").on(table.country),
  })
);
