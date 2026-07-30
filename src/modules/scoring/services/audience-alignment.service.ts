import { Injectable } from "@nestjs/common";
import { AppError } from "../../../common/exceptions/app.error";
import {
  AUDIENCE_ALIGNMENT_DYNAMIC_WEIGHTS,
  AUDIENCE_ALIGNMENT_STATIC_CONFIG,
  AUDIENCE_ALIGNMENT_STATIC_WEIGHTS,
} from "../config/audience-alignment-weights.config";
import { ConditionAlignmentRepository } from "../repositories/condition-alignment.repository";
import type { AudienceAlignmentResult } from "../types/audience-alignment.types";

type PlatformLinkWithRaw = {
  id: string;
  platform: string;
  rawData: Record<string, unknown> | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function calculateLanguageScore(
  brandLanguageCodes: string[],
  platformLinks: PlatformLinkWithRaw[],
  weight: number,
): { score: number; matched: boolean } {
  const audienceLanguages = new Set<string>();

  for (const link of platformLinks) {
    const raw = link.rawData;
    if (!raw) continue;

    if (link.platform === "instagram") {
      const langs =
        ((raw.user as Record<string, unknown> | undefined)
          ?.audience_languages as Array<{ code: string }> | undefined) ?? [];
      langs.forEach((l) => audienceLanguages.add(String(l.code).toLowerCase()));
    }

    if (link.platform === "youtube") {
      const report = raw.report as Record<string, unknown> | undefined;
      const features = report?.features as Record<string, unknown> | undefined;
      const langs =
        ((features?.audience_languages as { data?: Array<{ title: string }> })
          ?.data as Array<{ title: string }> | undefined) ?? [];
      langs.forEach((l) =>
        audienceLanguages.add(String(l.title).toLowerCase()),
      );
    }
  }

  const matched = brandLanguageCodes.some((code) =>
    audienceLanguages.has(code.toLowerCase()),
  );

  return { score: matched ? weight : 0, matched };
}

function calculateHealthConditionScoreFromRows(
  brandHealthConditions: string[],
  athleteScores: Array<{
    score: number;
    resonanceCondition?: { keywords?: string[] | null } | null;
  }>,
  weight: number,
): { score: number; matched: string[] } {
  if (!brandHealthConditions.length) {
    return { score: 0, matched: [] };
  }

  const matched: string[] = [];

  for (const brandCondition of brandHealthConditions) {
    const brandConditionLower = brandCondition.toLowerCase();

    for (const athleteScore of athleteScores) {
      const condition = athleteScore.resonanceCondition;
      if (!condition) continue;

      const keywords = (condition.keywords as string[]) ?? [];
      const isMatch = keywords.some(
        (kw) =>
          kw.toLowerCase().includes(brandConditionLower) ||
          brandConditionLower.includes(kw.toLowerCase()),
      );

      if (isMatch && !matched.includes(brandCondition)) {
        matched.push(brandCondition);
      }
    }
  }

  const matchRatio = matched.length / brandHealthConditions.length;
  const score = Math.round(matchRatio * weight * 100) / 100;

  return { score, matched };
}

function calculateAgeRangeScore(
  platformLinks: PlatformLinkWithRaw[],
  ageConfig: { min: number; max: number },
  weight: number,
): { score: number; audienceAgeInRange: number } {
  const agePercentages: number[] = [];

  for (const link of platformLinks) {
    const raw = link.rawData;
    if (!raw) continue;

    if (link.platform === "instagram") {
      const demography =
        ((raw.user as Record<string, unknown> | undefined)
          ?.demography_by_age as Array<{
          by_age_group?: Array<{ group: string; value?: number }>;
        }> | undefined) ?? [];

      let inRangePct = 0;
      for (const genderGroup of demography) {
        for (const ageGroup of genderGroup.by_age_group ?? []) {
          const [minStr, maxStr] = ageGroup.group.replace("age", "").split("-");
          const groupMin = parseInt(minStr, 10) || 0;
          const groupMax = maxStr === "" ? 999 : parseInt(maxStr, 10) || 999;
          const overlaps =
            groupMin <= ageConfig.max && groupMax >= ageConfig.min;
          if (overlaps) inRangePct += ageGroup.value ?? 0;
        }
      }
      agePercentages.push(inRangePct);
    }

    if (link.platform === "youtube") {
      const report = raw.report as Record<string, unknown> | undefined;
      const features = report?.features as Record<string, unknown> | undefined;
      const ageGender =
        ((features?.audience_age_gender as { data?: Record<string, unknown> })
          ?.data as Record<string, { male?: number; female?: number }>) ?? {};

      let inRangePct = 0;
      for (const [ageKey, genderData] of Object.entries(ageGender)) {
        const [minStr, maxStr] = ageKey.split("-");
        const groupMin = parseInt(minStr, 10) || 0;
        const groupMax =
          maxStr === "+" || maxStr === undefined
            ? 999
            : parseInt(maxStr, 10) || 999;
        const overlaps =
          groupMin <= ageConfig.max && groupMax >= ageConfig.min;
        if (overlaps) {
          inRangePct += (genderData.male ?? 0) + (genderData.female ?? 0);
        }
      }
      agePercentages.push(inRangePct);
    }
  }

  if (!agePercentages.length) {
    return { score: 0, audienceAgeInRange: 0 };
  }

  const avgInRange =
    agePercentages.reduce((sum, p) => sum + p, 0) / agePercentages.length;
  const score =
    Math.round(clamp(avgInRange / 100, 0, 1) * weight * 100) / 100;

  return { score, audienceAgeInRange: Math.round(avgInRange * 100) / 100 };
}

function calculateCountryScore(
  platformLinks: PlatformLinkWithRaw[],
  targetCountries: string[],
  weight: number,
): { score: number; matched: boolean } {
  const countryPercentages: number[] = [];
  const normalizedTargets = targetCountries.map((c) => c.toLowerCase());

  for (const link of platformLinks) {
    const raw = link.rawData;
    if (!raw) continue;

    if (link.platform === "instagram") {
      const countries =
        (((raw.user as Record<string, unknown> | undefined)
          ?.audience_geography as
          | { countries?: Array<{ code: string; value?: number }> }
          | undefined)?.countries as Array<{
          code: string;
          value?: number;
        }> | undefined) ?? [];

      const matchPct = countries
        .filter((c) => normalizedTargets.includes(c.code.toLowerCase()))
        .reduce((sum, c) => sum + (c.value ?? 0), 0);
      countryPercentages.push(matchPct);
    }

    if (link.platform === "youtube") {
      const report = raw.report as Record<string, unknown> | undefined;
      const features = report?.features as Record<string, unknown> | undefined;
      const geoData =
        ((features?.audience_geo as { data?: Array<{ title: string; prc?: number }> })
          ?.data as Array<{ title: string; prc?: number }> | undefined) ?? [];

      const matchPct = geoData
        .filter((g) => normalizedTargets.includes(g.title.toLowerCase()))
        .reduce((sum, g) => sum + (g.prc ?? 0), 0);
      countryPercentages.push(matchPct);
    }
  }

  if (!countryPercentages.length) {
    return { score: 0, matched: false };
  }

  const avgPct =
    countryPercentages.reduce((sum, p) => sum + p, 0) /
    countryPercentages.length;
  const score = Math.round(clamp(avgPct / 50, 0, 1) * weight * 100) / 100;

  return { score, matched: avgPct > 0 };
}

function calculateSentimentScore(
  platformLinks: PlatformLinkWithRaw[],
  positiveSentimentMin: number,
  weight: number,
): { score: number; positiveSentimentPct: number } {
  const sentimentValues: number[] = [];

  for (const link of platformLinks) {
    const raw = link.rawData;
    if (!raw) continue;

    if (link.platform === "instagram") {
      const prc =
        (
          (
            (raw.user as Record<string, unknown> | undefined)
              ?.audience_sentiments as
              | { sentiments?: { POSITIVE?: { prc?: number } } }
              | undefined
          )?.sentiments?.POSITIVE?.prc
        ) ?? null;
      if (prc !== null && prc !== undefined) sentimentValues.push(Number(prc));
    }

    if (link.platform === "youtube") {
      const report = raw.report as Record<string, unknown> | undefined;
      const features = report?.features as Record<string, unknown> | undefined;
      const prc =
        (
          (
            features?.audience_sentiments as
              | {
                  data?: {
                    sentiments?: { POSITIVE?: { prc?: number } };
                  };
                }
              | undefined
          )?.data?.sentiments?.POSITIVE?.prc
        ) ?? null;
      if (prc !== null && prc !== undefined) sentimentValues.push(Number(prc));
    }
  }

  if (!sentimentValues.length) {
    return { score: 0, positiveSentimentPct: 0 };
  }

  const avgSentiment =
    sentimentValues.reduce((sum, v) => sum + v, 0) / sentimentValues.length;
  const score =
    avgSentiment >= positiveSentimentMin
      ? weight
      : Math.round((avgSentiment / positiveSentimentMin) * weight * 100) / 100;

  return {
    score: clamp(score, 0, weight),
    positiveSentimentPct: Math.round(avgSentiment * 100) / 100,
  };
}

function calculateBloggerReachScore(
  platformLinks: PlatformLinkWithRaw[],
  bloggerReachMin: number,
  weight: number,
): { score: number; bloggerReach: number } {
  const reachValues: number[] = [];

  for (const link of platformLinks) {
    const raw = link.rawData;
    if (!raw) continue;

    if (link.platform === "instagram") {
      const reach =
        (
          (raw.user as Record<string, unknown> | undefined)?.blogger_reach as
            | { reach?: number }
            | undefined
        )?.reach ?? null;
      if (reach !== null && reach !== undefined) reachValues.push(Number(reach));
    }

    if (link.platform === "youtube") {
      const report = raw.report as Record<string, unknown> | undefined;
      const features = report?.features as Record<string, unknown> | undefined;
      const reach =
        (
          (features?.blogger_reach as { data?: { reach?: number } } | undefined)
            ?.data?.reach
        ) ?? null;
      if (reach !== null && reach !== undefined) reachValues.push(Number(reach));
    }
  }

  if (!reachValues.length) {
    return { score: 0, bloggerReach: 0 };
  }

  const maxReach = Math.max(...reachValues);
  const score =
    maxReach >= bloggerReachMin
      ? weight
      : Math.round((maxReach / bloggerReachMin) * weight * 100) / 100;

  return {
    score: clamp(score, 0, weight),
    bloggerReach: maxReach,
  };
}

@Injectable()
export class AudienceAlignmentService {
  constructor(
    private readonly repository: ConditionAlignmentRepository,
  ) {}

  private emptyResult(): AudienceAlignmentResult {
    return {
      overallScore: 0,
      breakdown: {
        languageScore: 0,
        healthConditionScore: 0,
        ageRangeScore: 0,
        countryScore: 0,
        positiveSentimentScore: 0,
        bloggerReachScore: 0,
      },
      details: {
        matchedLanguage: false,
        matchedHealthConditions: [],
        audienceAgeInRange: 0,
        matchedCountry: false,
        positiveSentimentPct: 0,
        bloggerReach: 0,
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

  async calculateAudienceAlignmentScore(
    brandId: string,
    athleteId: string,
  ): Promise<AudienceAlignmentResult> {
    if (!brandId) return this.emptyResult();

    try {
      const brand = await this.repository.findBrandById(brandId);
      if (!brand) throw new AppError(404, "Brand not found", "NOT_FOUND");

      const [
        brandLanguageCodes,
        brandHealthConditions,
        platformLinks,
        athleteScores,
      ] = await Promise.all([
        this.repository.getBrandLanguageCodes(brandId),
        this.repository.getBrandHealthConditionNames(brandId),
        this.repository.getAthletePlatformLinks(athleteId),
        this.repository.findAllAthleteResonanceScores(athleteId),
      ]);

      const rawByLinkId = await this.repository.getLatestRawPayloadByLinkId(
        platformLinks.map((link) => link.id),
      );

      const linksWithRaw: PlatformLinkWithRaw[] = platformLinks.map((link) => ({
        id: link.id,
        platform: link.platform,
        rawData: rawByLinkId.get(link.id) ?? null,
      }));

      const { age, countries, positiveSentimentMin, bloggerReachMin } =
        AUDIENCE_ALIGNMENT_STATIC_CONFIG;

      const languageResult = calculateLanguageScore(
        brandLanguageCodes,
        linksWithRaw,
        AUDIENCE_ALIGNMENT_DYNAMIC_WEIGHTS.languageMatch,
      );
      const healthConditionResult = calculateHealthConditionScoreFromRows(
        brandHealthConditions,
        athleteScores,
        AUDIENCE_ALIGNMENT_DYNAMIC_WEIGHTS.healthConditionMatch,
      );
      const ageResult = calculateAgeRangeScore(
        linksWithRaw,
        age,
        AUDIENCE_ALIGNMENT_STATIC_WEIGHTS.ageRangeMatch,
      );
      const countryResult = calculateCountryScore(
        linksWithRaw,
        countries,
        AUDIENCE_ALIGNMENT_STATIC_WEIGHTS.countryMatch,
      );
      const sentimentResult = calculateSentimentScore(
        linksWithRaw,
        positiveSentimentMin,
        AUDIENCE_ALIGNMENT_STATIC_WEIGHTS.positiveSentiment,
      );
      const reachResult = calculateBloggerReachScore(
        linksWithRaw,
        bloggerReachMin,
        AUDIENCE_ALIGNMENT_STATIC_WEIGHTS.bloggerReach,
      );

      const overallScore =
        languageResult.score +
        healthConditionResult.score +
        ageResult.score +
        countryResult.score +
        sentimentResult.score +
        reachResult.score;

      return {
        overallScore: Math.round(overallScore * 100) / 100,
        breakdown: {
          languageScore: languageResult.score,
          healthConditionScore: healthConditionResult.score,
          ageRangeScore: ageResult.score,
          countryScore: countryResult.score,
          positiveSentimentScore: sentimentResult.score,
          bloggerReachScore: reachResult.score,
        },
        details: {
          matchedLanguage: languageResult.matched,
          matchedHealthConditions: healthConditionResult.matched,
          audienceAgeInRange: ageResult.audienceAgeInRange,
          matchedCountry: countryResult.matched,
          positiveSentimentPct: sentimentResult.positiveSentimentPct,
          bloggerReach: reachResult.bloggerReach,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (this.isMissingRelationError(error)) return this.emptyResult();
      throw error;
    }
  }
}
