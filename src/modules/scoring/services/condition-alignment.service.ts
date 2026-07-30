import { Injectable } from "@nestjs/common";
import { AppError } from "../../../common/exceptions/app.error";
import { CONDITION_ALIGNMENT_WEIGHTS } from "../config/condition-alignment-weights.config";
import { ConditionAlignmentRepository } from "../repositories/condition-alignment.repository";
import type {
  ConditionAlignmentResult,
  MatchedHealthCondition,
} from "../types/condition-alignment.types";

type PlatformLinkWithRaw = {
  id: string;
  athleteId?: string;
  platform: string;
  rawData: Record<string, unknown> | null;
};

type AthleteResonanceScoreRow = {
  athleteId: string;
  score: number;
  resonanceCondition?: {
    keywords?: string[] | null;
  } | null;
};

type BrandAlignmentContext = {
  healthConditions: string[];
  languageCodes: string[];
  preferredChannels: string[];
  brandHashtags: Set<string>;
};

function calculateLanguageScore(
  brandLanguageCodes: string[],
  platformLinks: PlatformLinkWithRaw[],
  weight: number,
): { score: number; matched: boolean } {
  const athleteLanguages = new Set<string>();

  for (const link of platformLinks) {
    const raw = link.rawData;
    if (!raw) continue;

    const igLangs =
      ((raw.user as Record<string, unknown> | undefined)
        ?.blogger_languages as string[] | undefined) ?? [];
    igLangs.forEach((l) => athleteLanguages.add(String(l).toLowerCase()));

    const report = raw.report as Record<string, unknown> | undefined;
    const features = report?.features as Record<string, unknown> | undefined;
    const ytLangs =
      ((features?.blogger_languages as { data?: string[] } | undefined)
        ?.data as string[] | undefined) ?? [];
    ytLangs.forEach((l) => athleteLanguages.add(String(l).toLowerCase()));
  }

  const matched = brandLanguageCodes.some((code) =>
    athleteLanguages.has(code.toLowerCase()),
  );

  return { score: matched ? weight : 0, matched };
}

function calculateChannelScore(
  brandPreferredChannels: string[],
  athleteSyncedPlatforms: string[],
  weight: number,
): { score: number; matched: boolean } {
  const normalizedPreferred = brandPreferredChannels.map((c) =>
    c.toLowerCase(),
  );
  const normalizedSynced = athleteSyncedPlatforms.map((p) => p.toLowerCase());
  const matched = normalizedPreferred.some((pref) =>
    normalizedSynced.includes(pref),
  );

  return { score: matched ? weight : 0, matched };
}

function calculateHealthConditionScoreFromRows(
  brandHealthConditions: string[],
  athleteScores: AthleteResonanceScoreRow[],
  weight: number,
): { score: number; matched: MatchedHealthCondition[] } {
  if (!brandHealthConditions.length) {
    return { score: 0, matched: [] };
  }

  const matched: MatchedHealthCondition[] = [];

  for (const brandCondition of brandHealthConditions) {
    const brandConditionLower = brandCondition.toLowerCase();

    for (const athleteScore of athleteScores) {
      const condition = athleteScore.resonanceCondition;
      if (!condition) continue;

      const keywords = (condition.keywords as string[]) ?? [];
      const matchedKeyword = keywords.find(
        (kw) =>
          kw.toLowerCase().includes(brandConditionLower) ||
          brandConditionLower.includes(kw.toLowerCase()),
      );

      if (matchedKeyword) {
        matched.push({
          brandCondition,
          matchedKeyword,
          resonanceScore: athleteScore.score,
        });
      }
    }
  }

  if (!matched.length) return { score: 0, matched: [] };

  const conditionScores = brandHealthConditions.map((brandCondition) => {
    const relevantMatches = matched.filter(
      (m) => m.brandCondition === brandCondition,
    );
    if (!relevantMatches.length) return 0;
    return Math.max(...relevantMatches.map((m) => m.resonanceScore));
  });

  const avgScore =
    conditionScores.reduce((sum, s) => sum + s, 0) / conditionScores.length;

  return {
    score: Math.round((avgScore / 100) * weight * 100) / 100,
    matched,
  };
}

function calculateHashtagScoreFromSets(
  allBrandHashtags: Set<string>,
  platformLinks: PlatformLinkWithRaw[],
  weight: number,
): { score: number; matched: string[] } {
  if (!allBrandHashtags.size) return { score: 0, matched: [] };

  const athleteHashtags = new Set<string>();

  for (const link of platformLinks) {
    const raw = link.rawData;
    if (!raw) continue;

    if (link.platform === "instagram") {
      const user = raw.user as Record<string, unknown> | undefined;
      const bloggerHashtags = user?.blogger_hashtags as
        | { performance?: Record<string, Array<{ text?: string }>> }
        | undefined;
      const perf = bloggerHashtags?.performance ?? {};
      Object.values(perf).forEach((arr) => {
        (arr ?? []).forEach((h) => {
          if (h?.text) athleteHashtags.add(h.text.toLowerCase());
        });
      });
    }

    if (link.platform === "youtube") {
      const media = (raw.media as Array<Record<string, unknown>>) ?? [];
      media.forEach((item) => {
        const features = item.features as { hashtags?: string[] } | undefined;
        (features?.hashtags ?? []).forEach((h) => {
          athleteHashtags.add(h.toLowerCase());
        });
      });
    }

    if (link.platform === "twitter") {
      const report = raw.report as Record<string, unknown> | undefined;
      const features = report?.features as Record<string, unknown> | undefined;
      const bloggerHashtags = features?.blogger_hashtags as
        | { data?: { performance?: Record<string, unknown[]> } }
        | undefined;
      const perf = bloggerHashtags?.data?.performance ?? {};
      Object.values(perf).forEach((arr) => {
        (arr ?? []).forEach((h) => {
          const tag =
            typeof h === "string"
              ? h
              : (h as { text?: string } | null)?.text;
          if (tag) athleteHashtags.add(String(tag).toLowerCase());
        });
      });
    }
  }

  const matched = [...allBrandHashtags].filter((h) => athleteHashtags.has(h));
  const matchRatio = matched.length / allBrandHashtags.size;

  return {
    score: Math.round(matchRatio * weight * 100) / 100,
    matched,
  };
}

function computeAlignmentResult(
  context: BrandAlignmentContext,
  platformLinks: PlatformLinkWithRaw[],
  athleteScores: AthleteResonanceScoreRow[],
): ConditionAlignmentResult {
  const syncedPlatforms = platformLinks.map((link) => link.platform);

  const languageResult = calculateLanguageScore(
    context.languageCodes,
    platformLinks,
    CONDITION_ALIGNMENT_WEIGHTS.languageMatch,
  );
  const channelResult = calculateChannelScore(
    context.preferredChannels,
    syncedPlatforms,
    CONDITION_ALIGNMENT_WEIGHTS.channelMatch,
  );
  const healthConditionResult = calculateHealthConditionScoreFromRows(
    context.healthConditions,
    athleteScores,
    CONDITION_ALIGNMENT_WEIGHTS.healthConditionMatch,
  );
  const hashtagResult = calculateHashtagScoreFromSets(
    context.brandHashtags,
    platformLinks,
    CONDITION_ALIGNMENT_WEIGHTS.hashtagMatch,
  );

  const overallScore =
    languageResult.score +
    channelResult.score +
    healthConditionResult.score +
    hashtagResult.score;

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    breakdown: {
      languageScore: languageResult.score,
      channelScore: channelResult.score,
      healthConditionScore: healthConditionResult.score,
      hashtagScore: hashtagResult.score,
    },
    details: {
      matchedLanguage: languageResult.matched,
      matchedChannel: channelResult.matched,
      matchedHealthConditions: healthConditionResult.matched,
      matchedHashtags: hashtagResult.matched,
    },
  };
}

@Injectable()
export class ConditionAlignmentService {
  constructor(
    private readonly repository: ConditionAlignmentRepository,
  ) {}

  private emptyResult(): ConditionAlignmentResult {
    return {
      overallScore: 0,
      breakdown: {
        languageScore: 0,
        channelScore: 0,
        healthConditionScore: 0,
        hashtagScore: 0,
      },
      details: {
        matchedLanguage: false,
        matchedChannel: false,
        matchedHealthConditions: [],
        matchedHashtags: [],
      },
    };
  }

  private isMissingRelationError(error: unknown): boolean {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" &&
            error !== null &&
            "message" in error
          ? String((error as { message: unknown }).message)
          : String(error);
    return (
      message.includes("does not exist") &&
      (message.includes("resonance_conditions") ||
        message.includes("athlete_resonance_scores"))
    );
  }

  private async loadBrandHashtags(
    brandHealthConditions: string[],
  ): Promise<Set<string>> {
    const allBrandHashtags = new Set<string>();
    if (!brandHealthConditions.length) return allBrandHashtags;

    await Promise.all(
      brandHealthConditions.map(async (condition) => {
        const record =
          await this.repository.findResonanceConditionByName(condition);
        if (record?.hashtags) {
          (record.hashtags as string[]).forEach((h) =>
            allBrandHashtags.add(h.toLowerCase()),
          );
        }
      }),
    );

    return allBrandHashtags;
  }

  private async loadBrandAlignmentContext(
    brandId: string,
  ): Promise<BrandAlignmentContext> {
    const brand = await this.repository.findBrandById(brandId);
    if (!brand) throw new AppError(404, "Brand not found", "NOT_FOUND");

    const [healthConditions, languageCodes, preferredChannels] =
      await Promise.all([
        this.repository.getBrandHealthConditionNames(brandId),
        this.repository.getBrandLanguageCodes(brandId),
        this.repository.getBrandPreferredChannelNames(brandId),
      ]);

    const brandHashtags = await this.loadBrandHashtags(healthConditions);

    return {
      healthConditions,
      languageCodes,
      preferredChannels,
      brandHashtags,
    };
  }

  /**
   * Batch: compute condition alignment for many athletes on a list page.
   * Loads brand once + platform links/raw + resonance in batch, then scores in memory.
   */
  async calculateConditionAlignmentScoresForAthletes(
    brandId: string,
    athleteIds: string[],
  ): Promise<Map<string, ConditionAlignmentResult>> {
    const results = new Map<string, ConditionAlignmentResult>();
    if (!brandId || !athleteIds.length) return results;

    const uniqueIds = [...new Set(athleteIds.filter(Boolean))];

    try {
      const context = await this.loadBrandAlignmentContext(brandId);

      const [platformLinks, resonanceScores] = await Promise.all([
        this.repository.getAthletePlatformLinksByAthleteIds(uniqueIds),
        this.repository.findAllAthleteResonanceScoresByAthleteIds(uniqueIds),
      ]);

      const rawByLinkId = await this.repository.getLatestRawPayloadByLinkId(
        platformLinks.map((link) => link.id),
      );

      const linksByAthlete = new Map<string, PlatformLinkWithRaw[]>();
      for (const link of platformLinks) {
        const list = linksByAthlete.get(link.athleteId) ?? [];
        list.push({
          id: link.id,
          athleteId: link.athleteId,
          platform: link.platform,
          rawData: rawByLinkId.get(link.id) ?? null,
        });
        linksByAthlete.set(link.athleteId, list);
      }

      const scoresByAthlete = new Map<string, AthleteResonanceScoreRow[]>();
      for (const row of resonanceScores) {
        const list = scoresByAthlete.get(row.athleteId) ?? [];
        list.push(row as AthleteResonanceScoreRow);
        scoresByAthlete.set(row.athleteId, list);
      }

      for (const athleteId of uniqueIds) {
        results.set(
          athleteId,
          computeAlignmentResult(
            context,
            linksByAthlete.get(athleteId) ?? [],
            scoresByAthlete.get(athleteId) ?? [],
          ),
        );
      }

      return results;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (this.isMissingRelationError(error)) {
        for (const athleteId of uniqueIds) {
          results.set(athleteId, this.emptyResult());
        }
        return results;
      }
      throw error;
    }
  }

  async calculateConditionAlignmentScore(
    brandId: string,
    athleteId: string,
  ): Promise<ConditionAlignmentResult> {
    if (!brandId) {
      return this.emptyResult();
    }

    const batch = await this.calculateConditionAlignmentScoresForAthletes(
      brandId,
      [athleteId],
    );
    return batch.get(athleteId) ?? this.emptyResult();
  }

  /** @deprecated Use calculateConditionAlignmentScore */
  calculate(_input: unknown): number | null {
    return null;
  }
}
