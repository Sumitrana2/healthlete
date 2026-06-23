import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const lookupOptions = pgTable(
  "lookup_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: varchar("type", { length: 50 }).notNull(),
    key: varchar("key", { length: 100 }).notNull(),
    label: varchar("label", { length: 200 }).notNull(),
    sortOrder: integer("sort_order").default(0),
    isActive: boolean("is_active").default(true),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    typeIdx: index("lookup_type_idx").on(t.type),
    typeKeyIdx: uniqueIndex("lookup_type_key_idx").on(t.type, t.key),
  })
);
