import { Injectable } from "@nestjs/common";
import { desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "../../../database/drizzle";
import {
  athleteLanguages,
  athletePlatformLinks,
  athleteResonanceScores,
  brandHealthConditions,
  brandPreferredChannels,
  brandRequiredLanguages,
  brands,
  healthConditions,
  instagramRawData,
  preferredChannels,
  resonanceConditions,
  twitterRawData,
  youtubeRawData,
} from "../../../database/drizzle/schema";

@Injectable()
export class ConditionAlignmentRepository {
  async findBrandById(brandId: string) {
    const [brand] = await db
      .select({ id: brands.id })
      .from(brands)
      .where(eq(brands.id, brandId))
      .limit(1);
    return brand ?? null;
  }

  async getBrandHealthConditionNames(brandId: string) {
    const rows = await db
      .select({ name: healthConditions.name })
      .from(brandHealthConditions)
      .innerJoin(
        healthConditions,
        eq(brandHealthConditions.healthConditionId, healthConditions.id),
      )
      .where(eq(brandHealthConditions.brandId, brandId));
    return rows.map((row) => row.name);
  }

  async getBrandLanguageCodes(brandId: string) {
    const rows = await db
      .select({ code: athleteLanguages.code })
      .from(brandRequiredLanguages)
      .innerJoin(
        athleteLanguages,
        eq(brandRequiredLanguages.languageId, athleteLanguages.id),
      )
      .where(eq(brandRequiredLanguages.brandId, brandId));
    return rows.map((row) => row.code);
  }

  async getBrandPreferredChannelNames(brandId: string) {
    const rows = await db
      .select({ name: preferredChannels.name })
      .from(brandPreferredChannels)
      .innerJoin(
        preferredChannels,
        eq(brandPreferredChannels.channelId, preferredChannels.id),
      )
      .where(eq(brandPreferredChannels.brandId, brandId));
    return rows.map((row) => row.name);
  }

  async getAthletePlatformLinks(athleteId: string) {
    return db
      .select({
        id: athletePlatformLinks.id,
        athleteId: athletePlatformLinks.athleteId,
        platform: athletePlatformLinks.platform,
      })
      .from(athletePlatformLinks)
      .where(eq(athletePlatformLinks.athleteId, athleteId));
  }

  /** Batch: platform links for many athletes — 1 query */
  async getAthletePlatformLinksByAthleteIds(athleteIds: string[]) {
    if (!athleteIds.length) return [];
    return db
      .select({
        id: athletePlatformLinks.id,
        athleteId: athletePlatformLinks.athleteId,
        platform: athletePlatformLinks.platform,
      })
      .from(athletePlatformLinks)
      .where(inArray(athletePlatformLinks.athleteId, athleteIds));
  }

  async getLatestRawPayloadByLinkId(linkIds: string[]) {
    if (!linkIds.length) {
      return new Map<string, Record<string, unknown>>();
    }

    const [instagramRows, youtubeRows, twitterRows] = await Promise.all([
      db
        .select({
          linkId: instagramRawData.linkId,
          payload: instagramRawData.payload,
        })
        .from(instagramRawData)
        .where(inArray(instagramRawData.linkId, linkIds))
        .orderBy(desc(instagramRawData.fetchedAt)),
      db
        .select({
          linkId: youtubeRawData.linkId,
          payload: youtubeRawData.payload,
        })
        .from(youtubeRawData)
        .where(inArray(youtubeRawData.linkId, linkIds))
        .orderBy(desc(youtubeRawData.fetchedAt)),
      db
        .select({
          linkId: twitterRawData.linkId,
          payload: twitterRawData.payload,
        })
        .from(twitterRawData)
        .where(inArray(twitterRawData.linkId, linkIds))
        .orderBy(desc(twitterRawData.fetchedAt)),
    ]);

    const latest = new Map<string, Record<string, unknown>>();
    for (const row of [...instagramRows, ...youtubeRows, ...twitterRows]) {
      if (!latest.has(row.linkId)) {
        latest.set(row.linkId, (row.payload ?? {}) as Record<string, unknown>);
      }
    }
    return latest;
  }

  async findAllAthleteResonanceScores(athleteId: string) {
    return db
      .select({
        athleteId: athleteResonanceScores.athleteId,
        score: athleteResonanceScores.score,
        resonanceCondition: {
          id: resonanceConditions.id,
          name: resonanceConditions.name,
          keywords: resonanceConditions.keywords,
          hashtags: resonanceConditions.hashtags,
        },
      })
      .from(athleteResonanceScores)
      .innerJoin(
        resonanceConditions,
        eq(
          athleteResonanceScores.resonanceConditionId,
          resonanceConditions.id,
        ),
      )
      .where(eq(athleteResonanceScores.athleteId, athleteId));
  }

  /** Batch: resonance scores + condition keywords for many athletes — 1 query */
  async findAllAthleteResonanceScoresByAthleteIds(athleteIds: string[]) {
    if (!athleteIds.length) return [];
    return db
      .select({
        athleteId: athleteResonanceScores.athleteId,
        score: athleteResonanceScores.score,
        resonanceCondition: {
          id: resonanceConditions.id,
          name: resonanceConditions.name,
          keywords: resonanceConditions.keywords,
          hashtags: resonanceConditions.hashtags,
        },
      })
      .from(athleteResonanceScores)
      .innerJoin(
        resonanceConditions,
        eq(
          athleteResonanceScores.resonanceConditionId,
          resonanceConditions.id,
        ),
      )
      .where(inArray(athleteResonanceScores.athleteId, athleteIds));
  }

  async findResonanceConditionByName(conditionName: string) {
    const [row] = await db
      .select()
      .from(resonanceConditions)
      .where(ilike(resonanceConditions.name, `%${conditionName}%`))
      .limit(1);
    return row ?? null;
  }
}
