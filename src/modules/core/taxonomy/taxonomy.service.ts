import * as taxonomyRepo from "./taxonomy.repository";
import type { TaxonomyResult } from "./taxonomy.types";
import type { TaxonomyQuery } from "./taxonomy.schema";
import { getCache, setCache } from "../../../utils/cache";
import { CACHE_KEYS, CACHE_TTL } from "../../../constants/app.constants";


export async function getTaxonomy(
  input: TaxonomyQuery
): Promise<TaxonomyResult[]> {
  const cacheKey = CACHE_KEYS.TAXONOMY_PLATFORM(input.platform, input.kind);

  const cached = await getCache<TaxonomyResult[]>(cacheKey);
  if (cached) return cached;

  const data = await taxonomyRepo.getTaxonomyByPlatformAndKind(
    input.platform,
    input.kind
  );

  await setCache(cacheKey, data, CACHE_TTL.TAXONOMY);

  return data;
}

export async function getAllTaxonomy() {
  const cacheKey = CACHE_KEYS.TAXONOMY_ALL;

  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const rows = await taxonomyRepo.getAllTaxonomy();

  const data = {
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

  await setCache(cacheKey, data, CACHE_TTL.TAXONOMY);

  return data;
}
