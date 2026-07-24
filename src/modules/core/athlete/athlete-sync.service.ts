import { AppError } from "../../../middleware/errorHandler";
import * as repository from "./athlete.repository";
import { AthletePlatformLink } from "./athlete.types";
import * as hyperAuditorClient from "../hyperauditor/hyperauditor.client";
import { enrichAthleteData } from "../ai/ai.client";

import { findOrCreateResonanceCondition } from "../resonance/resonance-condition.service";
import { extractTextFromRawData } from "../resonance/text-extractor";
import { calculateResonanceForCondition } from "../resonance/resonance-calculator";
import * as resonanceRepo from "../resonance/resonance-condition.repository";
import {
  normalizeInstagramMedia,
  normalizeYoutubeMedia,
  normalizeTwitterMedia,
  NormalizedMediaItem,
} from "./media-normalizer";
import { calculateOverallScore } from "./score-calculator";
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

    // ── Step 1 — Har platform ka raw data fetch + save karo ──────────────────────
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

    try {
      const aiResult = await enrichAthleteData({
        fullName: athlete.fullName,
        usernames: collectedUsernames,
      });

      console.log(aiResult.countryName, "aiResult.countryName");
      const healthConditionTags = aiResult.healthConditions ?? [];

      const resonanceConditionRecords = [];
      for (const tag of healthConditionTags) {
        const record = await findOrCreateResonanceCondition(tag);
        resonanceConditionRecords.push(record);
      }

      console.log("resonanceConditionRecords",resonanceConditionRecords);

      const extractedTexts = links
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
      // const overallScore = calculateOverallScore({
      //   credibilityScore: null,  
      //   resonanceAvgScore: resonanceSummary.averageScore,
      //   resonanceMaxScore: resonanceSummary.maxScore,
      //   audienceTrustScore: null, 
      // });

      await repository.upsertAthleteFinalScore(athleteId, {
        resonanceScore: resonanceSummary.averageScore,
        scoreBreakdown: {
          resonanceMax: resonanceSummary.maxScore,
          resonanceMaxCondition: resonanceSummary.maxCondition,
          resonanceDetails: resonanceSummary.breakdown,
        },
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
      });

      results.push({ platform: "ai-enrichment", status: "success" });
    } catch (aiErr) {
      
      results.push({
        platform: "ai-enrichment",
        status: "failed",
        error: aiErr instanceof Error ? aiErr.message : "AI enrichment failed",
      });
    }

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
    // for (const item of mediaItems) {
    //   console.log("mediaItemsmediaItemsmediaItems",{
    //     id: item.externalMediaId,
    //     likes: item.likesCount,
    //     comments: item.commentsCount,
    //     views: item.viewsCount,
    //     engagement: item.engagementRate,
    //   });
    // }
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
