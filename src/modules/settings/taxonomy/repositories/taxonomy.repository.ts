import { Injectable } from "@nestjs/common";
import { db } from "../../../../database/drizzle";
import { platformTaxonomy } from "../../../../database/drizzle/schema";
import { eq, and } from "drizzle-orm";
import type { Platform, Kind } from "../dto/taxonomy.dto";

@Injectable()
export class TaxonomyRepository {
async getTaxonomyByPlatformAndKind(
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

  async getAllTaxonomy() {
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
}
