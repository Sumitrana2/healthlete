import {
  athletes,
  athleteFinalScores,
  athletePlatformLinks,
  healthConditions,
} from "../../../database/drizzle/schema";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { Injectable } from "@nestjs/common";
import { db } from "../../../database/drizzle";
import { buildPaginationMeta } from "../../../common/dto/pagination.dto";
import { calculateAthleteSyncStats } from "../utils/athlete-sync.util";
import { resolveHealthConditionValues } from "../utils/resolve-health-conditions.util";
import { toClientPaginatedData } from "../../../common/utils/paginated-list-response.util";
import { toNodeReportState } from "../utils/admin-athlete-response.util";
import type { BrandAthletesListQuery } from "../dto/brand-athlete.dto";

function parseScore(value: string | null | undefined) {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

@Injectable()
export class AthleteDiscoverRepository {
  async findSyncedAthletes(query: BrandAthletesListQuery) {
    const syncedAthleteIds = await db
      .selectDistinct({ athleteId: athletePlatformLinks.athleteId })
      .from(athletePlatformLinks)
      .where(
        sql`${athletePlatformLinks.reportState}::text IN ('ready', 'completed')`,
      );

    const ids = syncedAthleteIds.map((row) => row.athleteId);
    if (ids.length === 0) {
      const meta = buildPaginationMeta(query.page, query.limit, 0);
      return toClientPaginatedData([], meta);
    }

    const conditions: SQL[] = [inArray(athletes.id, ids)];
    if (query.search) {
      conditions.push(
        or(
          ilike(athletes.fullName, `%${query.search}%`),
          ilike(athletes.slug, `%${query.search}%`),
        )!,
      );
    }

    if (query.healthConditionIds?.length) {
      const conditionRows = await db
        .select({ id: healthConditions.id, name: healthConditions.name })
        .from(healthConditions)
        .where(inArray(healthConditions.id, query.healthConditionIds));

      const matchValues = [
        ...new Set([
          ...query.healthConditionIds,
          ...conditionRows.map((row) => row.name),
        ]),
      ];

      conditions.push(
        sql`EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(
            CASE
              WHEN jsonb_typeof(coalesce(${athletes.healthConditions}, '[]'::jsonb)) = 'array'
              THEN coalesce(${athletes.healthConditions}, '[]'::jsonb)
              ELSE '[]'::jsonb
            END
          ) AS hc(value)
          WHERE hc.value = ANY(${matchValues})
        )`,
      );
    }

    const where = and(...conditions);
    const offset = (query.page - 1) * query.limit;

    const [items, countRow] = await Promise.all([
      db
        .select({
          id: athletes.id,
          fullName: athletes.fullName,
          slug: athletes.slug,
          avatarUrl: athletes.avatarUrl,
          country: athletes.country,
          description: athletes.description,
          healthConditions: athletes.healthConditions,
          categories: athletes.categories,
          createdAt: athletes.createdAt,
          updatedAt: athletes.updatedAt,
        })
        .from(athletes)
        .where(where)
        .orderBy(desc(athletes.updatedAt), desc(athletes.createdAt))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(athletes)
        .where(where),
    ]);

    const athleteIds = items.map((item) => item.id);
    const [links, scores] = await Promise.all([
      athleteIds.length === 0
        ? Promise.resolve([])
        : db
            .select({
              id: athletePlatformLinks.id,
              athleteId: athletePlatformLinks.athleteId,
              platform: athletePlatformLinks.platform,
              username: athletePlatformLinks.username,
              profileUrl: athletePlatformLinks.profileUrl,
              displayTitle: athletePlatformLinks.displayTitle,
              subscribersCount: athletePlatformLinks.subscribersCount,
              reportState: athletePlatformLinks.reportState,
            })
            .from(athletePlatformLinks)
            .where(inArray(athletePlatformLinks.athleteId, athleteIds)),
      athleteIds.length === 0
        ? Promise.resolve([])
        : db
            .select({
              athleteId: athleteFinalScores.athleteId,
              healthleteMatchScore: athleteFinalScores.healthleteMatchScore,
              resonanceScore: athleteFinalScores.resonanceScore,
              credibilityScore: athleteFinalScores.credibilityScore,
              audienceTrustScore: athleteFinalScores.audienceTrustScore,
              brandOverSafetyScore: athleteFinalScores.brandOverSafetyScore,
              conditionAlignmentScore:
                athleteFinalScores.conditionAlignmentScore,
            })
            .from(athleteFinalScores)
            .where(inArray(athleteFinalScores.athleteId, athleteIds)),
    ]);

    const linksByAthlete = new Map<string, typeof links>();
    for (const link of links) {
      const existing = linksByAthlete.get(link.athleteId) ?? [];
      existing.push(link);
      linksByAthlete.set(link.athleteId, existing);
    }

    const scoresByAthlete = new Map(
      scores.map((score) => [score.athleteId, score]),
    );

    const enriched = await Promise.all(
      items.map(async (athlete) => {
        const platformLinks = linksByAthlete.get(athlete.id) ?? [];
        const finalScores = scoresByAthlete.get(athlete.id);
        const primaryLink = platformLinks.reduce<(typeof platformLinks)[number] | undefined>(
          (best, link) => {
            if (!best) return link;
            return (link.subscribersCount ?? 0) > (best.subscribersCount ?? 0)
              ? link
              : best;
          },
          undefined,
        );
        const syncStats = calculateAthleteSyncStats(platformLinks);
        const match = parseScore(finalScores?.healthleteMatchScore);
        const resonance = parseScore(finalScores?.resonanceScore);
        const credibility = parseScore(finalScores?.credibilityScore);
        const trust = parseScore(finalScores?.audienceTrustScore);
        const brandOverSafety = parseScore(
          finalScores?.brandOverSafetyScore,
        );
        const conditionAlignment = parseScore(
          finalScores?.conditionAlignmentScore,
        );

        const resolvedConditions = query.includeHealthConditions
          ? await resolveHealthConditionValues(athlete.healthConditions)
          : [];

        return {
          id: athlete.id,
          slug: athlete.slug,
          fullName: athlete.fullName,
          avatarUrl: athlete.avatarUrl,
          country: athlete.country,
          description: athlete.description,
          healthConditions: resolvedConditions,
          tags: Array.isArray(athlete.categories) ? athlete.categories : [],
          syncStatus: "pending",
          isActive: true,
          createdAt: athlete.createdAt,
          updatedAt: athlete.updatedAt,
          title: primaryLink?.displayTitle ?? athlete.fullName,
          primaryPlatform: primaryLink?.platform ?? null,
          ...(query.includePlatformLinks
            ? {
                platformLinks: platformLinks.map((link) => ({
                  id: link.id,
                  platform: link.platform,
                  username: link.username,
                  profileUrl: link.profileUrl,
                  displayTitle: link.displayTitle,
                  isPrimary: link.id === primaryLink?.id,
                  reportState: toNodeReportState(link.reportState),
                })),
              }
            : {}),
          finalScore: {
            healthleteMatchScore: match,
            resonanceScore: resonance,
            credibilityScore: credibility,
            audienceTrustScore: trust,
            brandOverSafetyScore: brandOverSafety,
            conditionAlignmentScore: conditionAlignment,
            match,
            resonance,
            credibility,
            trust,
          },
          score: match,
          healthleteScore: match,
          matchScore: match,
          match,
          resonance,
          credibility,
          trust,
          ...syncStats,
        };
      }),
    );

    const total = countRow[0]?.count ?? 0;
    return toClientPaginatedData(
      enriched,
      buildPaginationMeta(query.page, query.limit, total),
    );
  }
}
