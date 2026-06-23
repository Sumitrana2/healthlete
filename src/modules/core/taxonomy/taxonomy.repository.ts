import { db } from "../../../db";
import { platformTaxonomy } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import type { Platform, Kind } from "./taxonomy.schema";



export async function getTaxonomyByPlatformAndKind(
  platform: Platform,
  kind: Kind
) {
  return db
    .select({
      id: platformTaxonomy.externalId,
      title: platformTaxonomy.title,
    })
    .from(platformTaxonomy)
    .where(
      and(
        eq(platformTaxonomy.platform, platform),
        eq(platformTaxonomy.kind, kind)
      )
    )
    .orderBy(platformTaxonomy.title);
}

export async function getAllTaxonomy() {
  return db
    .select({
      platform: platformTaxonomy.platform,
      kind: platformTaxonomy.kind,
      id: platformTaxonomy.externalId,
      title: platformTaxonomy.title,
    })
    .from(platformTaxonomy)
    .orderBy(
      platformTaxonomy.platform,
      platformTaxonomy.kind,
      platformTaxonomy.title
    );
}
