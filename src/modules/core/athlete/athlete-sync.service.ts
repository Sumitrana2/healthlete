import { AppError } from "../../../middleware/errorHandler";
import * as repository from "./athlete.repository";
import { AthletePlatformLink } from "./athlete.types";
import * as hyperAuditorClient from "../hyperauditor/hyperauditor.client";
import { enrichAthleteData } from "../ai/ai.client";

import { findOrCreateResonanceCondition } from "../resonance/resonance-condition.service";
import { extractTextFromRawData } from "../resonance/text-extractor";
import {
  calculateResonanceForCondition,
  calculateResonancePersonalHealthCondition,
} from "../resonance/resonance-calculator";
import * as resonanceRepo from "../resonance/resonance-condition.repository";
import {
  normalizeInstagramMedia,
  normalizeYoutubeMedia,
  normalizeTwitterMedia,
  NormalizedMediaItem,
} from "./media-normalizer";
import {
  calculateCredibilityForPlatform,
  calculateOverallCredibility,
} from "../credibility/credibility.service";
import { calculateNormalizedWeights } from "../scoring/platform-weights.config";
import {
  calculateAudienceTrustForPlatform,
  calculateOverallAudienceTrust,
} from "../audience-trust/audience-trust.service";
import { EngagementQualityResult } from "../engagement/engagement.types";
import { calculateEngagementQuality } from "../engagement/engagement.service";

export async function syncAthleteData(athleteId: string, provider: string) {
  const athlete = await repository.findAthleteById(athleteId);
  if (!athlete) throw new AppError(404, "Athlete not found");

  const links = await repository.findAllPlatformLinksForAthleteByProvider(
    athleteId,
    provider
  );

  if (!links.length) {
    throw new AppError(400, "No platform links found for this athlete");
  }

  const results = [];
  const collectedUsernames: string[] = [];

  try {
    await repository.upsertAthleteProvider(athleteId, provider, "syncing");

    // ── Step 1 — Har platform ka raw data fetch + save karo ────────────────────
    for (const link of links) {
      try {
        const normalized = await syncSinglePlatformLink(link);

        await repository.updatePlatformLinkSyncData(link.id, {
          rawData: normalized.raw,
          profileUrl: normalized.profile_url ?? link.profileUrl,
          reportState: "ready",
          lastSyncedAt: new Date(),
        });

        if (link.username) collectedUsernames.push(link.username);
        results.push({ platform: link.platform, status: "success" });
      } catch (err) {
        await repository
          .updatePlatformLinkSyncData(link.id, {
            rawData: null,
            reportState: "failed",
            lastSyncedAt: new Date(),
          })
          .catch(() => {});

        results.push({
          platform: link.platform,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    let personalHealthConnections: any = null;
    // ── Step 2 — AI enrichment ──────────────────────────────────────────────────
    try {
      const aiResult = await enrichAthleteData({
        fullName: athlete.fullName,
        usernames: collectedUsernames,
      });

      await repository.updateAthleteAggregatedFields(athleteId, {
        description: aiResult.description,
        isDescriptionAdded: true,
        country: aiResult.country,
        countryName: aiResult.countryName,
        gender: aiResult.gender,
        languages: aiResult.languages ?? [],
        categories: aiResult.categories ?? [],
        healthConditions: aiResult.healthConditions ?? [],
        personalHealthConnections: aiResult.personalHealthConnections ?? [],
      });

      personalHealthConnections = aiResult.personalHealthConnections;
      console.log(
        aiResult.personalHealthConnections,
        "aiResult.personalHealthConnections"
      );

      results.push({ platform: "ai-enrichment", status: "success" });
    } catch (aiErr) {
      results.push({
        platform: "ai-enrichment",
        status: "failed",
        error: aiErr instanceof Error ? aiErr.message : "AI enrichment failed",
      });
    }

    // ── Step 3 — Resonance calculate karo (DB ke healthConditions se) ──────────
    let resonanceScoreForFinal = 0;
    let resonanceBreakdownForFinal: any = null;

    try {
      const refreshedAthlete = await repository.findAthleteById(athleteId);
      const currentHealthConditions =
        (refreshedAthlete?.healthConditions as string[]) ?? [];

      // if (currentHealthConditions.length) {
      await repository.deleteAthleteResonanceScores(athleteId);

      const resonanceConditionRecords = [];
      for (const tag of currentHealthConditions) {
        const record = await findOrCreateResonanceCondition(tag);
        resonanceConditionRecords.push(record);
      }

      const refreshedLinks =
        await repository.findAllPlatformLinksForAthleteByProvider(
          athleteId,
          provider
        );

      const extractedTexts = refreshedLinks
        .filter((link) => link.rawData)
        .map((link) =>
          extractTextFromRawData(link.provider, link.platform, link.rawData)
        );

      const resonanceScores = resonanceConditionRecords.map((condition) =>
        calculateResonanceForCondition(
          {
            id: condition.id,
            condition: condition.name,
            keywords: (condition.keywords as string[]) ?? [],
            hashtags: (condition.hashtags as string[]) ?? [],
          },
          extractedTexts
        )
      );

      await resonanceRepo.saveAthleteResonanceScores(
        athleteId,
        resonanceScores
      );

      const resonanceSummary = await repository.getResonanceSummary(athleteId);

      const personalHealthScore = calculateResonancePersonalHealthCondition(
        resonanceConditionRecords.map((c) => ({
          condition: c.name,
        })),
        personalHealthConnections
      );

      resonanceScoreForFinal =
        resonanceSummary.averageScore + personalHealthScore.score;
      resonanceBreakdownForFinal = {
        max: resonanceSummary.maxScore,
        maxCondition: resonanceSummary.maxCondition,
        personalHealthConnection: {
          score: personalHealthScore.score,
          matched: personalHealthScore.matched,
          unmatched: personalHealthScore.unmatched,
        },
        details: resonanceSummary.breakdown,
      };

      results.push({ platform: "resonance-calculation", status: "success" });
    } catch (resonanceErr) {
      results.push({
        platform: "resonance-calculation",
        status: "failed",
        error:
          resonanceErr instanceof Error
            ? resonanceErr.message
            : "Resonance calculation failed",
      });
    }

    // ── Step 4 — Credibility calculate karo ─────────────────────────────────────
    let credibilityScoreForFinal = 0;
    let credibilityBreakdownForFinal: any = null;
    let normalizedWeightsForFinal: Record<string, number> = {};

    try {
      const refreshedLinksForCred =
        await repository.findAllPlatformLinksForAthleteByProvider(
          athleteId,
          provider
        );

      const platformCredibilityResults = refreshedLinksForCred
        .filter((link) => link.rawData)
        .map((link) =>
          calculateCredibilityForPlatform(link.platform, link.rawData)
        )
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const linkedPlatformNames = refreshedLinksForCred.map((l) => l.platform);
      normalizedWeightsForFinal =
        calculateNormalizedWeights(linkedPlatformNames);

      const { overallScore, breakdown } = calculateOverallCredibility(
        platformCredibilityResults,
        normalizedWeightsForFinal
      );

      credibilityScoreForFinal = overallScore;
      credibilityBreakdownForFinal = breakdown;

      results.push({ platform: "credibility-calculation", status: "success" });
    } catch (credErr) {
      results.push({
        platform: "credibility-calculation",
        status: "failed",
        error:
          credErr instanceof Error
            ? credErr.message
            : "Credibility calculation failed",
      });
    }

    // ── Step 6 — Audience Trust calculate karo ──────────────────────────────────
    let audienceTrustScoreForFinal = 0;
    let brandOverSafetyScore = 0;
    let audienceTrustBreakdownForFinal: any = null;

    try {
      const refreshedLinksForTrust =
        await repository.findAllPlatformLinksForAthleteByProvider(
          athleteId,
          provider
        );

      const platformTrustResults = refreshedLinksForTrust
        .filter((link) => link.rawData)
        .map((link) =>
          calculateAudienceTrustForPlatform(link.platform, link.rawData)
        )
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const linkedPlatformNamesForTrust = refreshedLinksForTrust.map(
        (l) => l.platform
      );
      const normalizedWeightsForTrust = calculateNormalizedWeights(
        linkedPlatformNamesForTrust
      );

      const { overallScore, breakdown, brandOverSafetyAllScore } =
        calculateOverallAudienceTrust(
          platformTrustResults,
          normalizedWeightsForTrust
        );

      audienceTrustScoreForFinal = overallScore;
      audienceTrustBreakdownForFinal = breakdown;
      brandOverSafetyScore = brandOverSafetyAllScore;

      results.push({
        platform: "audience-trust-calculation",
        status: "success",
      });
    } catch (trustErr) {
      results.push({
        platform: "audience-trust-calculation",
        status: "failed",
        error:
          trustErr instanceof Error
            ? trustErr.message
            : "Audience trust calculation failed",
      });
    }

    // ── Step 7 — Engagement Quality ─────────────────────────────────────────────
    let engagementResultForFinal: EngagementQualityResult | null = null;

    try {
      const refreshedLinksForEngagement =
        await repository.findAllPlatformLinksForAthleteByProvider(
          athleteId,
          provider
        );

      const linksWithRawData = refreshedLinksForEngagement
        .filter((link) => link.rawData)
        .map((link) => ({ platform: link.platform, rawData: link.rawData }));

      const linkedPlatformNames = refreshedLinksForEngagement.map(
        (l) => l.platform
      );
      const normalizedWeights = calculateNormalizedWeights(linkedPlatformNames);

      engagementResultForFinal = calculateEngagementQuality(
        linksWithRawData,
        normalizedWeights
      );

      results.push({ platform: "engagement-calculation", status: "success" });
    } catch (engagementErr) {
      results.push({
        platform: "engagement-calculation",
        status: "failed",
        error:
          engagementErr instanceof Error
            ? engagementErr.message
            : "Engagement calculation failed",
      });
    }

    let conditionAlignmentScoreForFinal = 0;
    let conditionAlignmentBreakdownForFinal: any = null;

    await repository.upsertAthleteFinalScore(athleteId, {
      resonanceScore: Math.round(resonanceScoreForFinal),
      credibilityScore: Math.round(credibilityScoreForFinal),
      audienceTrustScore: Math.round(audienceTrustScoreForFinal),
      brandOverSafetyScore: Math.round(brandOverSafetyScore),
      avgEngagementRate:
        engagementResultForFinal?.avgEngagementRate != null
          ? Math.round(engagementResultForFinal.avgEngagementRate)
          : null,

      avgLikes:
        engagementResultForFinal?.avgLikes != null
          ? Math.round(engagementResultForFinal.avgLikes)
          : null,

      avgComments:
        engagementResultForFinal?.avgComments != null
          ? Math.round(engagementResultForFinal.avgComments)
          : null,
      conditionAlignmentScore: Math.round(conditionAlignmentScoreForFinal),
      weightDistribution: normalizedWeightsForFinal,
      engagementQualityScore:
        engagementResultForFinal?.engagementQualityScore ?? null,

      scoreBreakdown: {
        resonance: resonanceBreakdownForFinal,
        credibility: credibilityBreakdownForFinal,
        audienceTrust: audienceTrustBreakdownForFinal,
        conditionAlignment: conditionAlignmentBreakdownForFinal,
        engagement: engagementResultForFinal?.breakdown ?? [],
      },
    });
    await repository.upsertAthleteProvider(athleteId, provider, "completed");
  } catch (err) {
    await repository.upsertAthleteProvider(athleteId, provider, "failed");
  }

  return results;
}

async function syncSinglePlatformLink(link: AthletePlatformLink) {
  if (!link.providerSocialId) {
    throw new AppError(400, `Missing provider social id for ${link.platform}`);
  }

  const mainReport = await fetchFromProvider(
    link.provider,
    link.platform,
    link.providerSocialId
  );
  const rawData = mainReport.raw as any;

  let mediaItems: NormalizedMediaItem[] = [];

  if (link.platform === "instagram" && link.username) {
    const mediaReport = await hyperAuditorClient.fetchInstagramMediaReport(
      link.username
    );
    mediaItems = normalizeInstagramMedia(mediaReport);
  } else if (link.platform === "youtube") {
    mediaItems = normalizeYoutubeMedia(rawData?.media ?? []);
  } else if (link.platform === "twitter") {
    mediaItems = normalizeTwitterMedia(rawData);
  }

  if (mediaItems.length) {
    await repository.upsertAthleteMedia(link.id, mediaItems);
  }

  mainReport.raw = {
    ...rawData,
    _extractedMedia: mediaItems,
  } as any;

  return mainReport;
}

async function fetchFromProvider(
  provider: string,
  platform: string,
  socialId: string
) {
  switch (provider) {
    case "hyperauditor":
      return fetchFromHyperAuditor(platform, socialId);
    default:
      throw new AppError(400, `Unsupported provider: ${provider}`);
  }
}

async function fetchFromHyperAuditor(platform: string, socialId: string) {
  switch (platform) {
    case "instagram":
      return hyperAuditorClient.fetchInstagramReport(socialId);
    case "youtube":
      return hyperAuditorClient.fetchYoutubeReport(socialId);
    case "twitter":
      return hyperAuditorClient.fetchTwitterReport(socialId);
    default:
      throw new AppError(
        400,
        `Unsupported platform for HyperAuditor: ${platform}`
      );
  }
}
