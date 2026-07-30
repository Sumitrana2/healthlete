import { Injectable } from "@nestjs/common";
import { TaxonomyRepository } from "../repositories/taxonomy.repository";
import type { TaxonomyResult } from "../types/taxonomy.types";
import type { TaxonomyQuery } from "../dto/taxonomy.dto";
import { getCache, setCache } from "../../../../common/utils/cache";
import { CACHE_KEYS, CACHE_TTL } from "../../../../common/constants/app.constants";

@Injectable()
export class TaxonomyService {
  constructor(private readonly repository: TaxonomyRepository) {}

  async getTaxonomy(input: TaxonomyQuery): Promise<TaxonomyResult[]> {
    const cacheKey = CACHE_KEYS.TAXONOMY_PLATFORM(input.platform, input.kind);
    const cached = await getCache<TaxonomyResult[]>(cacheKey);
    if (cached) return cached;

    const data = await this.repository.getTaxonomyByPlatformAndKind(
      input.platform,
      input.kind
    );
    await setCache(cacheKey, data, CACHE_TTL.TAXONOMY);
    return data;
  }

  async getAllTaxonomy() {
    const cacheKey = CACHE_KEYS.TAXONOMY_ALL;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const rows = await this.repository.getAllTaxonomy();
    const data = {
      ig: {
        categories: rows.filter((r) => r.platform === "ig" && r.kind === "category"),
        interests: rows.filter((r) => r.platform === "ig" && r.kind === "interest"),
      },
      yt: {
        categories: rows.filter((r) => r.platform === "yt" && r.kind === "category"),
      },
    };
    await setCache(cacheKey, data, CACHE_TTL.TAXONOMY);
    return data;
  }
}
