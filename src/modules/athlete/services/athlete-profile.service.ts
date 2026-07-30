import { Injectable } from "@nestjs/common";
import { sql } from "drizzle-orm";
import { AthleteSyncRepository } from "../repositories/athlete-sync.repository";
import { AthleteRepository } from "../repositories/athlete.repository";
import { AthleteSyncService } from "./athlete-sync.service";
import { ConditionAlignmentService } from "../../scoring/services/condition-alignment.service";
import { AudienceAlignmentService } from "../../scoring/services/audience-alignment.service";
import { resolveHealthConditionValues } from "../utils/resolve-health-conditions.util";
import { db } from "../../../database/drizzle";
import type { BrandAthleteDetailQuery } from "../dto/brand-athlete.dto";
import type { AudienceAlignmentResult } from "../../scoring/types/audience-alignment.types";

function parseScore(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCount(value: number | null) {
  if (value === null) return null;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

const MATCH_WEIGHTS = {
  conditionAlignment: 0.25,
  credibility: 0.25,
  audienceTrust: 0.25,
  resonance: 0.25,
};

function calculateMatchScore(
  scores: {
    credibilityScore: number;
    audienceTrustScore: number;
    resonanceScore: number;
  },
  conditionAlignmentScore: number,
): number {
  const score =
    conditionAlignmentScore * MATCH_WEIGHTS.conditionAlignment +
    scores.credibilityScore * MATCH_WEIGHTS.credibility +
    scores.audienceTrustScore * MATCH_WEIGHTS.audienceTrust +
    scores.resonanceScore * MATCH_WEIGHTS.resonance;

  return Math.round(score * 100) / 100;
}

function deriveBrandOverSafetyScore(
  stored: number | null,
  scoreBreakdown: unknown,
  weightDistribution: unknown,
): number {
  if (stored !== null) return Math.round(stored);

  const trust =
    typeof scoreBreakdown === "object" &&
    scoreBreakdown !== null &&
    Array.isArray((scoreBreakdown as { audienceTrust?: unknown }).audienceTrust)
      ? ((scoreBreakdown as { audienceTrust: Array<{ platform: string; breakdown?: { brandSafety?: number } }> }).audienceTrust)
      : [];

  const weights =
    typeof weightDistribution === "object" && weightDistribution !== null
      ? (weightDistribution as Record<string, number>)
      : {};

  if (!trust.length) return 0;

  let sum = 0;
  let totalWeight = 0;
  for (const row of trust) {
    const weight = weights[row.platform] ?? 0;
    sum += (row.breakdown?.brandSafety ?? 0) * (weight / 100);
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(sum) : 0;
}

function emptyAudienceAlignment(): AudienceAlignmentResult {
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

@Injectable()
export class AthleteProfileService {
  constructor(
    private readonly syncRepository: AthleteSyncRepository,
    private readonly athleteRepository: AthleteRepository,
    private readonly syncService: AthleteSyncService,
    private readonly conditionAlignmentService: ConditionAlignmentService,
    private readonly audienceAlignmentService: AudienceAlignmentService,
  ) {}

  private async getAthleteProviders(athleteId: string) {
    try {
      const rows = await db.execute(sql`
        SELECT id, athlete_id, provider, sync_status, last_synced_at, created_at
        FROM athlete_providers
        WHERE athlete_id = ${athleteId}
      `);

      const list = Array.isArray(rows)
        ? rows
        : ((rows as { rows?: unknown[] }).rows ?? []);

      return list.map((row: any) => ({
        id: row.id,
        athleteId: row.athlete_id ?? row.athleteId,
        provider: row.provider,
        syncStatus: row.sync_status ?? row.syncStatus,
        lastSyncedAt: row.last_synced_at ?? row.lastSyncedAt ?? null,
        createdAt: row.created_at ?? row.createdAt,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Brand detail — Node-parity response shape.
   * Condition Alignment uses Nest calculator (unchanged).
   * Audience Alignment + brandOverSafetyScore match Node.
   */
  async getBrandAthleteDetail(
    identifier: string,
    brandId: string,
    query: BrandAthleteDetailQuery = {
      includeHealthConditions: true,
      includePlatformLinks: true,
    },
  ) {
    const base =
      (await this.athleteRepository.findById(identifier)) ??
      (await this.syncRepository.findAthleteBySlugOrId(identifier).then(async (a) =>
        a ? this.athleteRepository.findById(a.id) : null,
      ));

    if (!base) {
      return null;
    }

    const athleteId = base.id as string;

    const [conditionAlignmentResult, audienceAlignmentResult, providers] =
      await Promise.all([
        this.conditionAlignmentService
          .calculateConditionAlignmentScore(brandId, athleteId)
          .catch(() => ({
            overallScore:
              parseScore(base.finalScore?.conditionAlignmentScore) ?? 0,
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
          })),
        this.audienceAlignmentService
          .calculateAudienceAlignmentScore(brandId, athleteId)
          .catch(() => emptyAudienceAlignment()),
        this.getAthleteProviders(athleteId),
      ]);

    const finalScore = base.finalScore ?? null;
    const resonanceScore = parseScore(finalScore?.resonanceScore) ?? 0;
    const credibilityScore = parseScore(finalScore?.credibilityScore) ?? 0;
    const audienceTrustScore = parseScore(finalScore?.audienceTrustScore) ?? 0;
    const brandOverSafetyScore = deriveBrandOverSafetyScore(
      parseScore(finalScore?.brandOverSafetyScore),
      finalScore?.scoreBreakdown,
      finalScore?.weightDistribution,
    );
    const conditionAlignmentScore = Math.round(
      conditionAlignmentResult.overallScore,
    );
    const healthleteMatchScore = calculateMatchScore(
      { credibilityScore, audienceTrustScore, resonanceScore },
      conditionAlignmentResult.overallScore,
    );

    const existingBreakdown =
      typeof finalScore?.scoreBreakdown === "object" &&
      finalScore?.scoreBreakdown !== null
        ? (finalScore.scoreBreakdown as Record<string, unknown>)
        : {};

    let healthConditions = base.healthConditions ?? [];
    if (query.includeHealthConditions) {
      const resolved = await resolveHealthConditionValues(
        Array.isArray(base.healthConditions) ? base.healthConditions : [],
      );
      // Prefer name strings for Node-parity when values are tags/names
      healthConditions =
        resolved.length > 0
          ? resolved.map((item) => item.name)
          : (base.healthConditions ?? []);
    }

    const platformLinks = query.includePlatformLinks
      ? (base.platformLinks ?? [])
      : undefined;

    return {
      ...base,
      healthConditions,
      ...(platformLinks ? { platformLinks } : { platformLinks: undefined }),
      providers,
      finalScore: finalScore
        ? {
            ...finalScore,
            resonanceScore,
            credibilityScore,
            audienceTrustScore,
            brandOverSafetyScore,
            conditionAlignmentScore,
            healthleteMatchScore,
            audienceAlignmentScore: audienceAlignmentResult,
            weightDistribution: finalScore.weightDistribution ?? null,
            scoreBreakdown: {
              ...existingBreakdown,
              conditionAlignment: {
                overallScore: conditionAlignmentResult.overallScore,
                breakdown: conditionAlignmentResult.breakdown,
                details: conditionAlignmentResult.details,
              },
            },
          }
        : {
            athleteId,
            resonanceScore,
            credibilityScore,
            audienceTrustScore,
            brandOverSafetyScore,
            conditionAlignmentScore,
            healthleteMatchScore,
            audienceAlignmentScore: audienceAlignmentResult,
            weightDistribution: null,
            scoreBreakdown: {
              conditionAlignment: {
                overallScore: conditionAlignmentResult.overallScore,
                breakdown: conditionAlignmentResult.breakdown,
                details: conditionAlignmentResult.details,
              },
            },
          },
    };
  }

  async getProfile(identifier: string) {
    const athlete = await this.syncRepository.findAthleteBySlugOrId(identifier);
    if (!athlete) {
      return null;
    }

    const [platformLinks, finalScores, analytics] = await Promise.all([
      this.syncRepository.getAthletePlatformLinks(athlete.id),
      this.syncRepository.getAthleteFinalScores(athlete.id),
      this.syncService.getMergedAnalyticsForAthlete(athlete.id),
    ]);

    const matchScore = parseScore(finalScores?.healthleteMatchScore) ?? 0;
    const resonanceScore = parseScore(finalScores?.resonanceScore) ?? 0;
    const credibilityScore = parseScore(finalScores?.credibilityScore) ?? 0;
    const audienceTrustScore = parseScore(finalScores?.audienceTrustScore) ?? 0;
    const conditionAlignmentScore =
      parseScore(finalScores?.conditionAlignmentScore) ?? 0;
    const brandOverSafetyScore =
      parseScore(finalScores?.brandOverSafetyScore) ?? 0;

    const resolvedConditions = await resolveHealthConditionValues(
      Array.isArray(athlete.healthConditions) ? athlete.healthConditions : [],
    );
    const primaryCondition =
      resolvedConditions[0]?.name ?? "Health Advocacy";
    const gender = analytics.demographics.gender;

    return {
      athlete: {
        id: athlete.id,
        slug: athlete.slug,
        fullName: athlete.fullName,
        avatarUrl: athlete.avatarUrl,
        country: athlete.country,
        description: athlete.description ?? null,
        healthConditions: resolvedConditions,
        tags: Array.isArray(athlete.categories) ? athlete.categories : [],
        syncStatus: "pending",
        lastSyncedAt: null,
        isActive: true,
      },
      platformLinks: platformLinks.map((link, index) => ({
        id: link.id,
        platform: link.platform,
        username: link.username,
        profileUrl: link.profileUrl,
        displayTitle: link.displayTitle,
        followers: link.subscribersCount,
        isVerified: link.isVerified,
        isPrimary:
          index ===
          platformLinks.reduce((bestIdx, candidate, candidateIdx) => {
            const bestCount =
              platformLinks[bestIdx]?.subscribersCount ?? 0;
            const candidateCount = candidate.subscribersCount ?? 0;
            return candidateCount > bestCount ? candidateIdx : bestIdx;
          }, 0),
        reportState: link.reportState,
        lastSyncedAt: link.lastSyncedAt,
        errorMessage: null,
      })),
      scores: {
        healthleteMatchScore: matchScore,
        resonanceScore,
        credibilityScore,
        audienceTrustScore,
        brandOverSafetyScore,
        conditionAlignmentScore,
        audienceAlignment: Math.round((resonanceScore + audienceTrustScore) / 2),
        brandSafety: credibilityScore,
        complianceScore: Math.min(99, credibilityScore),
        trustScore: audienceTrustScore,
      },
      analytics: {
        followers: analytics.followers,
        engagementRate: analytics.engagementRate,
        avgLikes: analytics.avgLikes,
        avgComments: analytics.avgComments,
        avgViews: analytics.avgViews,
        avgShares: analytics.avgShares,
        reach: analytics.reach,
        audienceQualityScore: analytics.audienceQualityScore,
        realFollowersPct: analytics.realFollowersPct,
        fakeFollowersPct: analytics.fakeFollowersPct,
        brandMentions: analytics.brandMentions,
        demographics: {
          gender: gender
            ? { women: gender.female, men: gender.male }
            : null,
          ageGroups: analytics.demographics.ageGroups,
          topCountries: analytics.demographics.topCountries,
          topCities: analytics.demographics.topCities,
        },
        interests: analytics.interests,
        languages: analytics.languages,
        formatted: {
          followers: formatCount(analytics.followers),
          avgLikes: formatCount(analytics.avgLikes),
          avgComments: formatCount(analytics.avgComments),
          avgViews: formatCount(analytics.avgViews),
          reach: formatCount(analytics.reach),
        },
      },
      content: {
        healthStory: [],
        campaigns: [],
        partnerships: [],
        testimonials: [],
      },
      meta: {
        primaryCondition,
        dataSources: ["database", "hypeauditor"],
      },
    };
  }
}
