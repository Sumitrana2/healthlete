import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

/** Live/Node-parity athletes table (no Nest-only columns). */
export const athletes = pgTable(
  "athletes",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    fullName: varchar("full_name", { length: 255 }).notNull(),

    slug: varchar("slug", { length: 255 }).notNull().unique(),

    avatarUrl: text("avatar_url"),

    country: varchar("country", { length: 2 }),

    countryName: varchar("country_name", { length: 100 }),

    languages: jsonb("languages").$type<string[]>(),

    emails: jsonb("emails").$type<string[]>(),

    description: text("description"),

    isDescriptionAdded: boolean("is_description_added").default(false).notNull(),

    isActive: boolean("is_active").default(true),

    categories: jsonb("categories").$type<string[]>(),

    /** Live stores jsonb; accept string[] at the app layer. */
    healthConditions: jsonb("health_conditions").$type<string[]>(),

    personalHealthConnections: jsonb("personalHealthConnections"),

    gender: varchar("gender", { length: 20 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("athletes_slug_idx").on(table.slug),

    countryIdx: index("athletes_country_idx").on(table.country),
  }),
);
