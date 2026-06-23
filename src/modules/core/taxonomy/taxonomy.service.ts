import * as taxonomyRepo from "./taxonomy.repository";
// import type { Platform, Kind } from "./taxonomy.repository";
import type { TaxonomyInput, TaxonomyResult } from "./taxonomy.types";
import type { TaxonomyQuery } from "./taxonomy.schema";


export async function getTaxonomy(
    input: TaxonomyQuery
): Promise<TaxonomyResult[]> {
    return taxonomyRepo.getTaxonomyByPlatformAndKind(
      input.platform,
      input.kind
    );
  }

export async function getAllTaxonomy() {
  const rows = await taxonomyRepo.getAllTaxonomy();

  return {
    ig: {
      categories: rows.filter(
        (r) => r.platform === "ig" && r.kind === "category"
      ),
      interests: rows.filter(
        (r) => r.platform === "ig" && r.kind === "interest"
      ),
    },
    yt: {
      categories: rows.filter(
        (r) => r.platform === "yt" && r.kind === "category"
      ),
    },
  };
}
