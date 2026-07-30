import { Injectable } from "@nestjs/common";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../../database/drizzle";
import {
  athleteFinalScores,
  athletePlatformLinks,
  athletes,
  instagramRawData,
  instagramScores,
  twitterRawData,
  twitterScores,
  youtubeRawData,
  youtubeScores,
} from "../../../database/drizzle/schema";
import { HypeAuditorPlatform } from "../../../integrations/hypeauditor/types/hypeauditor.types";
import { ExtractedPlatformAnalytics } from "../../../integrations/hypeauditor/utils/hypeauditor-analytics.extractor";
import {
  clampDecimalScore,
  normalizeEngagementMetric,
  normalizeFollowerWeight,
} from "../../scoring/utils/score-normalization.util";

type PlatformLinkRecord = {
  id: string;
  athleteId: string;
  platform: HypeAuditorPlatform;
  hyperauditSocialId: string | null;
  username: string | null;
  subscribersCount: number | null;
  reportState: string;
};

type ScoreFields = ExtractedPlatformAnalytics["scores"];

@Injectable()
export class AthleteSyncRepository {
  async getPlatformLinksForAthlete(athleteId: string) {
    const rows = await db
      .select({
        id: athletePlatformLinks.id,
        athleteId: athletePlatformLinks.athleteId,
        platform: athletePlatformLinks.platform,
        providerSocialId: athletePlatformLinks.providerSocialId,
        username: athletePlatformLinks.username,
        subscribersCount: athletePlatformLinks.subscribersCount,
        reportState: athletePlatformLinks.reportState,
      })
      .from(athletePlatformLinks)
      .where(eq(athletePlatformLinks.athleteId, athleteId));

    return rows.map((row) => ({
      id: row.id,
      athleteId: row.athleteId,
      platform: row.platform,
      hyperauditSocialId: row.providerSocialId ?? null,
      username: row.username,
      subscribersCount: row.subscribersCount,
      reportState: row.reportState,
    }));
  }

  async getPlatformLinkById(linkId: string) {
    const [link] = await db
      .select({
        id: athletePlatformLinks.id,
        athleteId: athletePlatformLinks.athleteId,
        platform: athletePlatformLinks.platform,
        providerSocialId: athletePlatformLinks.providerSocialId,
        username: athletePlatformLinks.username,
        subscribersCount: athletePlatformLinks.subscribersCount,
        reportState: athletePlatformLinks.reportState,
      })
      .from(athletePlatformLinks)
      .where(eq(athletePlatformLinks.id, linkId))
      .limit(1);

    if (!link) return null;

    return {
      id: link.id,
      athleteId: link.athleteId,
      platform: link.platform,
      hyperauditSocialId: link.providerSocialId ?? null,
      username: link.username,
      subscribersCount: link.subscribersCount,
      reportState: link.reportState,
    };
  }

  async updateAthleteSyncStatus(
    athleteId: string,
    _syncStatus: "pending" | "syncing" | "completed" | "failed",
    _lastSyncedAt?: Date,
  ) {
    // Live athletes table has no sync_status / last_synced_at.
    await db
      .update(athletes)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(athletes.id, athleteId));
  }

  async updatePlatformLinkState(
    linkId: string,
    state: {
      reportState: "not_synced" | "syncing" | "ready" | "failed";
      lastSyncedAt?: Date | null;
      errorMessage?: string | null;
      subscribersCount?: number | null;
    },
  ) {
    await db
      .update(athletePlatformLinks)
      .set({
        reportState: state.reportState,
        lastSyncedAt: state.lastSyncedAt,
        // Live has no error_message — ignore state.errorMessage.
        subscribersCount: state.subscribersCount,
        updatedAt: new Date(),
      })
      .where(eq(athletePlatformLinks.id, linkId));
  }

  async saveRawReport(
    platform: HypeAuditorPlatform,
    linkId: string,
    payload: Record<string, unknown>,
  ) {
    const values = { linkId, payload };

    switch (platform) {
      case "instagram":
        await db.insert(instagramRawData).values(values);
        return;
      case "youtube":
        await db.insert(youtubeRawData).values(values);
        return;
      case "twitter":
        await db.insert(twitterRawData).values(values);
        return;
      case "tiktok":
        // Live has no tiktok_raw_data — persist on the platform link.
        await db
          .update(athletePlatformLinks)
          .set({
            rawData: payload,
            updatedAt: new Date(),
          })
          .where(eq(athletePlatformLinks.id, linkId));
        return;
    }
  }

  private toDecimal(value: number | null) {
    const normalized = clampDecimalScore(value);
    return normalized === null ? null : normalized.toFixed(2);
  }

  private scoreValues(scores: ScoreFields, platformWeight: number | null) {
    return {
      erScore: this.toDecimal(scores.erScore),
      commentScore: this.toDecimal(scores.commentScore),
      sentimentScore: this.toDecimal(scores.sentimentScore),
      spreadScore: this.toDecimal(scores.spreadScore),
      consistencyScore: this.toDecimal(scores.consistencyScore),
      resonanceScore: this.toDecimal(scores.resonanceScore),
      credibilityScore: this.toDecimal(scores.credibilityScore),
      audienceTrustScore: this.toDecimal(scores.audienceTrustScore),
      conditionAlignmentScore: this.toDecimal(scores.conditionAlignmentScore),
      platformWeightApplied: this.toDecimal(normalizeFollowerWeight(platformWeight)),
    };
  }

  async replacePlatformScores(
    platform: HypeAuditorPlatform,
    linkId: string,
    scores: ScoreFields,
    platformWeight: number | null,
  ) {
    const values = {
      linkId,
      ...this.scoreValues(scores, platformWeight),
    };

    switch (platform) {
      case "instagram":
        await db.delete(instagramScores).where(eq(instagramScores.linkId, linkId));
        await db.insert(instagramScores).values(values);
        return;
      case "youtube":
        await db.delete(youtubeScores).where(eq(youtubeScores.linkId, linkId));
        await db.insert(youtubeScores).values(values);
        return;
      case "twitter":
        await db.delete(twitterScores).where(eq(twitterScores.linkId, linkId));
        await db.insert(twitterScores).values(values);
        return;
      case "tiktok":
        // Live has no tiktok_scores — scores stay in-memory / final aggregation only.
        return;
    }
  }

  async getLatestRawReports(linkIds: string[]) {
    if (linkIds.length === 0) {
      return new Map<string, Record<string, unknown>>();
    }

    const [instagramRows, youtubeRows, twitterRows, linkRows] =
      await Promise.all([
        db
          .select({
            linkId: instagramRawData.linkId,
            payload: instagramRawData.payload,
            fetchedAt: instagramRawData.fetchedAt,
          })
          .from(instagramRawData)
          .where(inArray(instagramRawData.linkId, linkIds))
          .orderBy(desc(instagramRawData.fetchedAt)),
        db
          .select({
            linkId: youtubeRawData.linkId,
            payload: youtubeRawData.payload,
            fetchedAt: youtubeRawData.fetchedAt,
          })
          .from(youtubeRawData)
          .where(inArray(youtubeRawData.linkId, linkIds))
          .orderBy(desc(youtubeRawData.fetchedAt)),
        db
          .select({
            linkId: twitterRawData.linkId,
            payload: twitterRawData.payload,
            fetchedAt: twitterRawData.fetchedAt,
          })
          .from(twitterRawData)
          .where(inArray(twitterRawData.linkId, linkIds))
          .orderBy(desc(twitterRawData.fetchedAt)),
        // Live has no tiktok_raw_data — fall back to link.raw_data.
        db
          .select({
            linkId: athletePlatformLinks.id,
            payload: athletePlatformLinks.rawData,
            fetchedAt: athletePlatformLinks.lastSyncedAt,
          })
          .from(athletePlatformLinks)
          .where(inArray(athletePlatformLinks.id, linkIds)),
      ]);

    const latest = new Map<string, Record<string, unknown>>();

    for (const row of [...instagramRows, ...youtubeRows, ...twitterRows]) {
      if (!latest.has(row.linkId)) {
        latest.set(row.linkId, row.payload as Record<string, unknown>);
      }
    }

    for (const row of linkRows) {
      if (!latest.has(row.linkId) && row.payload) {
        latest.set(row.linkId, row.payload as Record<string, unknown>);
      }
    }

    return latest;
  }

  async getPlatformScoresForLinks(links: PlatformLinkRecord[]) {
    const instagramIds = links
      .filter((link) => link.platform === "instagram")
      .map((link) => link.id);
    const youtubeIds = links
      .filter((link) => link.platform === "youtube")
      .map((link) => link.id);
    const twitterIds = links
      .filter((link) => link.platform === "twitter")
      .map((link) => link.id);

    const [instagram, youtube, twitter] = await Promise.all([
      instagramIds.length
        ? db
            .select()
            .from(instagramScores)
            .where(inArray(instagramScores.linkId, instagramIds))
        : Promise.resolve([]),
      youtubeIds.length
        ? db
            .select()
            .from(youtubeScores)
            .where(inArray(youtubeScores.linkId, youtubeIds))
        : Promise.resolve([]),
      twitterIds.length
        ? db
            .select()
            .from(twitterScores)
            .where(inArray(twitterScores.linkId, twitterIds))
        : Promise.resolve([]),
    ]);

    return [...instagram, ...youtube, ...twitter];
  }

  async upsertAthleteFinalScores(
    athleteId: string,
    scores: {
      resonanceScore: number | null;
      credibilityScore: number | null;
      audienceTrustScore: number | null;
      conditionAlignmentScore: number | null;
      healthleteMatchScore: number | null;
      weightDistribution: Record<string, number>;
    },
  ) {
    const values = {
      athleteId,
      resonanceScore: this.toDecimal(scores.resonanceScore),
      credibilityScore: this.toDecimal(scores.credibilityScore),
      audienceTrustScore: this.toDecimal(scores.audienceTrustScore),
      conditionAlignmentScore: this.toDecimal(scores.conditionAlignmentScore),
      healthleteMatchScore: this.toDecimal(scores.healthleteMatchScore),
      weightDistribution: scores.weightDistribution,
      calculatedAt: new Date(),
      updatedAt: new Date(),
    };

    const [existing] = await db
      .select({ id: athleteFinalScores.id })
      .from(athleteFinalScores)
      .where(eq(athleteFinalScores.athleteId, athleteId))
      .limit(1);

    if (existing) {
      await db
        .update(athleteFinalScores)
        .set(values)
        .where(eq(athleteFinalScores.athleteId, athleteId));
      return;
    }

    await db.insert(athleteFinalScores).values(values);
  }

  async getAthleteFinalScores(athleteId: string) {
    const [scores] = await db
      .select({
        id: athleteFinalScores.id,
        athleteId: athleteFinalScores.athleteId,
        resonanceScore: athleteFinalScores.resonanceScore,
        credibilityScore: athleteFinalScores.credibilityScore,
        audienceTrustScore: athleteFinalScores.audienceTrustScore,
        brandOverSafetyScore: athleteFinalScores.brandOverSafetyScore,
        conditionAlignmentScore: athleteFinalScores.conditionAlignmentScore,
        healthleteMatchScore: athleteFinalScores.healthleteMatchScore,
        weightDistribution: athleteFinalScores.weightDistribution,
        scoreBreakdown: athleteFinalScores.scoreBreakdown,
        calculatedAt: athleteFinalScores.calculatedAt,
        createdAt: athleteFinalScores.createdAt,
        updatedAt: athleteFinalScores.updatedAt,
      })
      .from(athleteFinalScores)
      .where(eq(athleteFinalScores.athleteId, athleteId))
      .limit(1);

    return scores ?? null;
  }

  async getAthleteById(athleteId: string) {
    const [athlete] = await db
      .select()
      .from(athletes)
      .where(eq(athletes.id, athleteId))
      .limit(1);

    return athlete ?? null;
  }

  async getAthletePlatformLinks(athleteId: string) {
    return db
      .select()
      .from(athletePlatformLinks)
      .where(eq(athletePlatformLinks.athleteId, athleteId));
  }

  async findAthleteBySlugOrId(identifier: string) {
    const [byId] = await db
      .select()
      .from(athletes)
      .where(eq(athletes.id, identifier))
      .limit(1);
    if (byId) return byId;

    const [bySlug] = await db
      .select()
      .from(athletes)
      .where(eq(athletes.slug, identifier))
      .limit(1);

    return bySlug ?? null;
  }
}
