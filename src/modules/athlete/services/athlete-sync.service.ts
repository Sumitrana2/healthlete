import { Injectable } from "@nestjs/common";
import logger from "../../../shared/logger/logger";
import { AppError } from "../../../common/exceptions/app.error";
import { AthleteSyncRepository } from "../repositories/athlete-sync.repository";
import { AthleteRepository } from "../repositories/athlete.repository";
import { HypeAuditorService } from "../../../integrations/hypeauditor/hypeauditor.service";
import { ScoreEngineService } from "../../scoring/services/score-engine.service";
import { AiClient } from "../../ai/services/ai-client.service";
import { ResonanceConditionService } from "../../scoring/services/resonance-condition.service";
import { HypeAuditorPlatform } from "../../../integrations/hypeauditor/types/hypeauditor.types";
import {
  extractPlatformAnalytics,
  mergePlatformAnalytics,
} from "../../../integrations/hypeauditor/utils/hypeauditor-analytics.extractor";
import { extractTextFromRawData } from "../../scoring/resonance/text-extractor";
import {
  calculateResonanceForCondition,
  calculateResonancePersonalHealthCondition,
  type PersonalHealthConnection,
} from "../../scoring/resonance/resonance-calculator";
import {
  calculateCredibilityForPlatform,
  calculateOverallCredibility,
} from "../../scoring/credibility/credibility.service";
import {
  calculateAudienceTrustForPlatform,
  calculateOverallAudienceTrust,
} from "../../scoring/audience-trust/audience-trust.service";
import { calculateNormalizedWeights } from "../../scoring/config/platform-weights.config";
import { calculateEngagementQuality } from "../../scoring/engagement/engagement.service";
import type { EngagementQualityResult } from "../../scoring/engagement/engagement.types";
import {
  normalizeInstagramMedia,
  normalizeTwitterMedia,
  normalizeYoutubeMedia,
  type NormalizedMediaItem,
} from "../utils/media-normalizer";
import { isReportSynced } from "../utils/report-state.util";

@Injectable()
export class AthleteSyncService {
  private readonly inFlight = new Set<string>();

  constructor(
    private readonly hypeAuditorService: HypeAuditorService,
    private readonly syncRepository: AthleteSyncRepository,
    private readonly athleteRepository: AthleteRepository,
    private readonly scoreService: ScoreEngineService,
    private readonly aiClient: AiClient,
    private readonly resonanceConditionService: ResonanceConditionService,
  ) {}

  triggerAthleteSync(athleteId: string) {
    if (this.inFlight.has(athleteId)) {
      return;
    }

    this.inFlight.add(athleteId);
    void this.syncAthlete(athleteId)
      .catch((error) => {
        logger.error(
          {
            athleteId,
            error: error instanceof Error ? error.message : String(error),
          },
          "Athlete sync failed",
        );
      })
      .finally(() => {
        this.inFlight.delete(athleteId);
      });
  }

  async syncAthlete(athleteId: string) {
    await this.forceSyncAthlete(athleteId);
  }

  async forceSyncAthlete(athleteId: string) {
    const athlete = await this.syncRepository.getAthleteById(athleteId);
    if (!athlete) {
      throw new AppError(404, "Athlete not found", "NOT_FOUND");
    }

    const links = await this.syncRepository.getPlatformLinksForAthlete(athleteId);
    if (links.length === 0) {
      throw new AppError(404, "No platform links found for athlete", "NOT_FOUND");
    }

    await this.syncRepository.updateAthleteSyncStatus(athleteId, "syncing");
    await this.athleteRepository.upsertAthleteProvider(
      athleteId,
      "hyperauditor",
      "syncing",
    );

    const results: Array<{
      platform: string;
      status: string;
      error?: string;
    }> = [];
    const collectedUsernames: string[] = [];

    for (const link of links) {
      try {
        await this.syncPlatformLink(link);
        if (link.username) collectedUsernames.push(link.username);
        results.push({ platform: link.platform, status: "success" });
      } catch (error) {
        results.push({
          platform: link.platform,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    let healthConditions: string[] = [];
    let personalHealthConnections: PersonalHealthConnection[] = [];
    try {
      const aiProfile = await this.aiClient.enrichAthleteData({
        fullName: athlete.fullName,
        usernames: collectedUsernames,
      });

      healthConditions = aiProfile.healthConditions ?? [];
      personalHealthConnections = aiProfile.personalHealthConnections ?? [];

      await this.athleteRepository.updateAiProfile(athleteId, {
        description: aiProfile.description,
        categories: aiProfile.categories ?? [],
        healthConditions,
        personalHealthConnections,
        country: aiProfile.country,
        countryName: aiProfile.countryName,
        gender: aiProfile.gender,
        languages: aiProfile.languages ?? [],
        isDescriptionAdded: true,
        isActive: true,
      });

      results.push({ platform: "ai-enrichment", status: "success" });
    } catch (aiError) {
      logger.error(
        {
          athleteId,
          error: aiError instanceof Error ? aiError.message : String(aiError),
        },
        "AI enrichment failed during athlete sync",
      );
      results.push({
        platform: "ai-enrichment",
        status: "failed",
        error:
          aiError instanceof Error ? aiError.message : "AI enrichment failed",
      });
    }

    let resonanceScoreForFinal = 0;
    let resonanceBreakdownForFinal: unknown = null;
    try {
      const refreshed = await this.syncRepository.getAthleteById(athleteId);
      const currentHealthConditions =
        (refreshed?.healthConditions as string[] | null) ?? healthConditions;
      const connectionsForResonance =
        (Array.isArray(refreshed?.personalHealthConnections)
          ? (refreshed.personalHealthConnections as PersonalHealthConnection[])
          : null) ?? personalHealthConnections;

      if (currentHealthConditions.length) {
        await this.resonanceConditionService.deleteAthleteResonanceScores(
          athleteId,
        );

        const resonanceConditionRecords =
          await this.resonanceConditionService.ensureConditionsForTags(
            currentHealthConditions,
          );

        const refreshedLinks =
          await this.syncRepository.getPlatformLinksForAthlete(athleteId);
        const rawByLinkId = await this.syncRepository.getLatestRawReports(
          refreshedLinks.map((link) => link.id),
        );

        const extractedTexts = refreshedLinks
          .map((link) => {
            const raw = rawByLinkId.get(link.id);
            if (!raw) return null;
            return extractTextFromRawData("hyperauditor", link.platform, raw);
          })
          .filter((item): item is NonNullable<typeof item> => item !== null);

        const resonanceScores = resonanceConditionRecords.map((condition) =>
          calculateResonanceForCondition(
            {
              id: condition.id,
              condition: condition.name,
              keywords: (condition.keywords as string[]) ?? [],
              hashtags: (condition.hashtags as string[]) ?? [],
            },
            extractedTexts,
          ),
        );

        await this.resonanceConditionService.saveAthleteResonanceScores(
          athleteId,
          resonanceScores,
        );

        const resonanceSummary =
          await this.athleteRepository.getResonanceSummary(athleteId);

        const personalHealthScore = calculateResonancePersonalHealthCondition(
          resonanceConditionRecords.map((c) => ({ condition: c.name })),
          connectionsForResonance,
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
      }

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

    let credibilityScoreForFinal = 0;
    let credibilityBreakdownForFinal: unknown = null;
    let normalizedWeightsForFinal: Record<string, number> = {};
    try {
      const refreshedLinks =
        await this.syncRepository.getPlatformLinksForAthlete(athleteId);
      const rawByLinkId = await this.syncRepository.getLatestRawReports(
        refreshedLinks.map((link) => link.id),
      );

      const platformCredibilityResults = refreshedLinks
        .map((link) => {
          const raw = rawByLinkId.get(link.id);
          if (!raw) return null;
          return calculateCredibilityForPlatform(link.platform, raw);
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const linkedPlatformNames = refreshedLinks.map((l) => l.platform);
      normalizedWeightsForFinal =
        calculateNormalizedWeights(linkedPlatformNames);

      const { overallScore, breakdown } = calculateOverallCredibility(
        platformCredibilityResults,
        normalizedWeightsForFinal,
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

    let audienceTrustScoreForFinal = 0;
    let brandOverSafetyScoreForFinal = 0;
    let audienceTrustBreakdownForFinal: unknown = null;
    try {
      const refreshedLinks =
        await this.syncRepository.getPlatformLinksForAthlete(athleteId);
      const rawByLinkId = await this.syncRepository.getLatestRawReports(
        refreshedLinks.map((link) => link.id),
      );

      const platformTrustResults = refreshedLinks
        .map((link) => {
          const raw = rawByLinkId.get(link.id);
          if (!raw) return null;
          return calculateAudienceTrustForPlatform(link.platform, raw);
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const linkedPlatformNames = refreshedLinks.map((l) => l.platform);
      const normalizedWeightsForTrust =
        calculateNormalizedWeights(linkedPlatformNames);

      const { overallScore, breakdown, brandOverSafetyAllScore } =
        calculateOverallAudienceTrust(
          platformTrustResults,
          normalizedWeightsForTrust,
        );

      audienceTrustScoreForFinal = overallScore;
      audienceTrustBreakdownForFinal = breakdown;
      brandOverSafetyScoreForFinal = brandOverSafetyAllScore;

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

    let engagementResultForFinal: EngagementQualityResult | null = null;
    try {
      const refreshedLinks =
        await this.syncRepository.getPlatformLinksForAthlete(athleteId);
      const rawByLinkId = await this.syncRepository.getLatestRawReports(
        refreshedLinks.map((link) => link.id),
      );

      const linksWithRawData = refreshedLinks
        .map((link) => {
          const rawData = rawByLinkId.get(link.id);
          if (!rawData) return null;
          return { platform: link.platform, rawData };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      const linkedPlatformNames = refreshedLinks.map((l) => l.platform);
      const normalizedWeights = calculateNormalizedWeights(linkedPlatformNames);

      engagementResultForFinal = calculateEngagementQuality(
        linksWithRawData,
        normalizedWeights,
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

    try {
      await this.athleteRepository.upsertAthleteFinalScore(athleteId, {
        resonanceScore: Math.round(resonanceScoreForFinal),
        credibilityScore: Math.round(credibilityScoreForFinal),
        audienceTrustScore: Math.round(audienceTrustScoreForFinal),
        brandOverSafetyScore: Math.round(brandOverSafetyScoreForFinal),
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
        engagementQualityScore:
          engagementResultForFinal?.engagementQualityScore ?? null,
        conditionAlignmentScore: 0,
        weightDistribution: normalizedWeightsForFinal,
        scoreBreakdown: {
          resonance: resonanceBreakdownForFinal,
          credibility: credibilityBreakdownForFinal,
          audienceTrust: audienceTrustBreakdownForFinal,
          conditionAlignment: null,
          engagement: engagementResultForFinal?.breakdown ?? [],
        },
      });

      const refreshedLinks =
        await this.syncRepository.getPlatformLinksForAthlete(athleteId);
      const totalCompleted = refreshedLinks.filter((item) =>
        isReportSynced(item.reportState),
      ).length;
      const syncStatus =
        totalCompleted === refreshedLinks.length ? "completed" : "failed";

      await this.syncRepository.updateAthleteSyncStatus(
        athleteId,
        syncStatus,
        new Date(),
      );
      await this.athleteRepository.upsertAthleteProvider(
        athleteId,
        "hyperauditor",
        syncStatus,
      );
    } catch (finalErr) {
      await this.syncRepository.updateAthleteSyncStatus(athleteId, "failed");
      await this.athleteRepository.upsertAthleteProvider(
        athleteId,
        "hyperauditor",
        "failed",
      );
      throw finalErr;
    }

    // keep ScoreEngineService unused warning away if still injected
    void this.scoreService;

    return { results };
  }

  private async buildExtractedMedia(
    platform: HypeAuditorPlatform,
    payload: Record<string, unknown>,
    username: string | null,
  ): Promise<NormalizedMediaItem[]> {
    try {
      if (platform === "twitter") {
        return normalizeTwitterMedia(payload);
      }
      if (platform === "youtube") {
        const media = Array.isArray((payload as { media?: unknown }).media)
          ? ((payload as { media: unknown[] }).media)
          : [];
        return normalizeYoutubeMedia(media);
      }
      if (platform === "instagram" && username) {
        const mediaReport =
          await this.hypeAuditorService.fetchInstagramMediaReport(username);
        return normalizeInstagramMedia(mediaReport);
      }
    } catch (error) {
      logger.warn(
        {
          platform,
          username,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to normalize platform media for resonance",
      );
    }
    return [];
  }

  private async syncPlatformLink(link: {
    id: string;
    athleteId: string;
    platform: HypeAuditorPlatform;
    hyperauditSocialId: string | null;
    username: string | null;
    subscribersCount: number | null;
    reportState: string;
  }) {
    const socialId = link.hyperauditSocialId;
    const username = link.username;

    if (!socialId && !username) {
      await this.syncRepository.updatePlatformLinkState(link.id, {
        reportState: "failed",
        errorMessage: "Missing social ID or username for sync",
      });
      throw new AppError(400, "Missing platform identifiers", "INVALID_PLATFORM");
    }

    await this.syncRepository.updatePlatformLinkState(link.id, {
      reportState: "syncing",
      errorMessage: null,
    });

    try {
      const payload = await this.hypeAuditorService.fetchPlatformReport(
        link.platform,
        socialId ?? username!,
        username ?? socialId!,
      );

      const mediaItems = await this.buildExtractedMedia(
        link.platform,
        payload as Record<string, unknown>,
        username,
      );

      // Node parity: attach _extractedMedia so resonance text extractor can score captions/hashtags
      const payloadWithMedia = {
        ...(payload as Record<string, unknown>),
        _extractedMedia: mediaItems,
      };

      await this.syncRepository.saveRawReport(
        link.platform,
        link.id,
        payloadWithMedia,
      );

      const analytics = extractPlatformAnalytics(payloadWithMedia);
      const platformWeight = analytics.followers ?? link.subscribersCount ?? 1;

      await this.syncRepository.replacePlatformScores(
        link.platform,
        link.id,
        analytics.scores,
        platformWeight,
      );

      await this.syncRepository.updatePlatformLinkState(link.id, {
        reportState: "ready",
        lastSyncedAt: new Date(),
        errorMessage: null,
        subscribersCount: analytics.followers ?? link.subscribersCount,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown sync error";

      await this.syncRepository.updatePlatformLinkState(link.id, {
        reportState: "failed",
        errorMessage: message,
      });

      throw error;
    }
  }

  async getMergedAnalyticsForAthlete(athleteId: string) {
    const links = await this.syncRepository.getPlatformLinksForAthlete(athleteId);
    const completedLinks = links.filter((link) =>
      isReportSynced(link.reportState),
    );
    const rawReports = await this.syncRepository.getLatestRawReports(
      completedLinks.map((link) => link.id),
    );

    const analytics = completedLinks
      .map((link) => {
        const payload = rawReports.get(link.id);
        return payload ? extractPlatformAnalytics(payload) : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return mergePlatformAnalytics(analytics);
  }
}
