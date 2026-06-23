import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { brands } from "./brands";

export const platformTaxonomy = pgTable(
  "platform_taxonomy",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    platform: varchar("platform", { length: 20 }).notNull(),
    kind: varchar("kind", { length: 20 }).notNull(),
    externalId: integer("external_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    platformKindIdx: index("taxonomy_platform_kind_idx").on(t.platform, t.kind),
    uniqueExternal: uniqueIndex("taxonomy_unique_idx").on(
      t.platform,
      t.kind,
      t.externalId
    ),
  })
);

// export const brandTaxonomySelections = pgTable(
//   "brand_taxonomy_selections",
//   {
//     id: uuid("id").primaryKey().defaultRandom(),
//     brandId: uuid("brand_id").notNull(),
//     taxonomyId: uuid("taxonomy_id").notNull(),
//     createdAt: timestamp("created_at").defaultNow().notNull(),
//   },
//   (t) => ({
//     brandIdx: index("bts_brand_idx").on(t.brandId),
//     taxonomyIdx: index("bts_taxonomy_idx").on(t.taxonomyId),
//     uniquePair: uniqueIndex("bts_unique_idx").on(t.brandId, t.taxonomyId),
//   })
// );

export const brandTaxonomySelections = pgTable(
  "brand_taxonomy_selections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    brandId: uuid("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    taxonomyId: uuid("taxonomy_id")
      .notNull()
      .references(() => platformTaxonomy.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    brandIdx: index("bts_brand_idx").on(t.brandId),
    taxonomyIdx: index("bts_taxonomy_idx").on(t.taxonomyId),
    uniquePair: uniqueIndex("bts_unique_idx").on(t.brandId, t.taxonomyId),
  })
);
