import { db } from "../../../db";
import {
  athletes,
  athleteProviders,
  athletePlatformLinks,
  athleteMedia,
  athleteFinalScores,
  athleteResonanceScores,
} from "../../../db/schema";
import { eq, ilike, and, inArray, count, exists } from "drizzle-orm";
import { makeUniqueSlug } from "../../../utils/slug";
import { paginate } from "../../../utils/paginate.util";
import type {
  AthleteAggregatedFields,
  AthleteFilters,
  PlatformSyncUpdate,
  SelectedPlatform,
  SyncStatus,
  UpdateAthleteDto,
} from "./athlete.types";
import { NormalizedMediaItem } from "./media-normalizer";

// ── Duplicacy Check ──────────────────────────────────────────────────────────────

export async function findExistingPlatformLink(
  provider: string,
  platform: string,
  providerSocialId: string
) {
  return db.query.athletePlatformLinks.findFirst({
    where: and(
      eq(athletePlatformLinks.provider, provider as any),
      eq(athletePlatformLinks.platform, platform as any),
      eq(athletePlatformLinks.providerSocialId, providerSocialId)
    ),
    with: {
      athlete: { columns: { id: true, fullName: true } },
    },
  });
}

export async function findAthletePlatformLink(
  athleteId: string,
  platform: string
) {
  return db.query.athletePlatformLinks.findFirst({
    where: and(
      eq(athletePlatformLinks.athleteId, athleteId),
      eq(athletePlatformLinks.platform, platform as any)
    ),
  });
}

// ── Create / Sync ──────────────────────────────────────────────────────────────

export async function insertAthleteForSync(data: {
  fullName: string;
  avatarUrl: string | null;
}) {
  const slug = await makeUniqueSlug(data.fullName, athletes, athletes.slug);

  const [athlete] = await db
    .insert(athletes)
    .values({
      fullName: data.fullName,
      slug,
      avatarUrl: data.avatarUrl,
      isActive: false,
    })
    .returning();

  return athlete;
}

export async function upsertAthleteProvider(
  athleteId: string,
  provider: string,
  syncStatus?: SyncStatus
) {
  await db
    .insert(athleteProviders)
    .values({
      athleteId,
      provider: provider as any,
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [athleteProviders.athleteId, athleteProviders.provider],
      set: {
        lastSyncedAt: new Date(),
        ...(syncStatus !== undefined ? { syncStatus } : {}),
      },
    });
}

export async function insertPlatformLink(
  athleteId: string,
  provider: string,
  platform: SelectedPlatform
) {
  const [link] = await db
    .insert(athletePlatformLinks)
    .values({
      athleteId,
      provider: provider as any,
      platform: platform.platform,
      providerSocialId: platform.social_id,
      username: platform.username,
      avatarUrl: platform.avatar_url,
      displayTitle: platform.display_title,
      subscribersCount: platform.subscribers_count ?? null,
      isVerified: platform.is_verified ?? false,
      lastSyncedAt: new Date(),
    })
    .returning();

  return link;
}

export async function findAthleteWithRelations(athleteId: string) {
  return db.query.athletes.findFirst({
    where: eq(athletes.id, athleteId),
    with: {
      platformLinks: true,
    },
  });
}

// ── Search ──────────────────────────────────────────────────────────────────────

export async function searchExistingAthletes(name: string) {
  const matchedAthleteIds = await db
    .selectDistinct({ athleteId: athletePlatformLinks.athleteId })
    .from(athletePlatformLinks)
    .where(ilike(athletePlatformLinks.displayTitle, `%${name}%`));

  const ids = matchedAthleteIds.map((r) => r.athleteId);
  if (!ids.length) return [];

  return db.query.athletes.findMany({
    where: inArray(athletes.id, ids),
    columns: {
      id: true,
      fullName: true,
      avatarUrl: true,
    },
    with: {
      platformLinks: {
        columns: {
          id: true,
          platform: true,
          username: true,
          displayTitle: true,
          subscribersCount: true,
          isVerified: true,
        },
      },
    },
  });
}

// ── Find ──────────────────────────────────────────────────────────────────────────

// export async function findAthleteById(id: string) {
//   return db.query.athletes.findFirst({
//     where: eq(athletes.id, id),
//     with: {
//       platformLinks: {
//         columns: { rawData: false },
//       },
//       providers: true,
//       finalScore:true
//     },
//   });
// }
export async function findAthleteById(
  id: string,
  rawData: boolean = false
) {
  return db.query.athletes.findFirst({
    where: eq(athletes.id, id),
    with: {
      platformLinks: rawData
        ? {} // Select all columns, including rawData
        : {
            columns: {
              rawData: false, // Exclude rawData
            },
          },
      providers: true,
      finalScore: true,
    },
  });
}
function buildWhereConditions(filters: AthleteFilters) {
  const conditions = [];

  if (filters.search) {
    conditions.push(ilike(athletes.fullName, `%${filters.search}%`));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(athletes.isActive, filters.isActive));
  }
  if (filters.syncStatus?.length) {
    conditions.push(
      exists(
        db
          .select()
          .from(athleteProviders)
          .where(
            and(
              eq(athleteProviders.athleteId, athletes.id),
              inArray(athleteProviders.syncStatus, filters.syncStatus as any)
            )
          )
      )
    );
  }

  return conditions.length ? and(...conditions) : undefined;
}

async function getData(
  filters: AthleteFilters & { page: number; limit: number },
  where: ReturnType<typeof buildWhereConditions>
) {
  return db.query.athletes.findMany({
    where,
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
    orderBy: (athletes, { desc }) => [desc(athletes.createdAt)],
    with: {
      ...(filters.includePlatformLinks
        ? {
            platformLinks: {
              columns: { rawData: false },
            },
          }
        : {}),
      ...(filters.includeProviders ? { providers: true } : {}),
      finalScore:true
    },
  });
}

async function getCount(
  where: ReturnType<typeof buildWhereConditions>
): Promise<number> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(athletes)
    .where(where);
  return Number(total);
}

export async function findAthletes(filters: AthleteFilters) {
  const where = buildWhereConditions(filters);

  return paginate(
    filters,
    (f) => getData(f, where),
    () => getCount(where)
  );
}

// ── Update (manual — sirf isActive) ────────────────────────────────────────────

export async function updateAthleteById(id: string, data: UpdateAthleteDto) {
  const [updated] = await db
    .update(athletes)
    .set({
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(athletes.id, id))
    .returning();

  return updated;
}

// ── Delete ──────────────────────────────────────────────────────────────────────

export async function deleteAthleteById(id: string) {
  await db.delete(athletes).where(eq(athletes.id, id));
}

export async function findPlatformLinkById(id: string) {
  return db.query.athletePlatformLinks.findFirst({
    where: eq(athletePlatformLinks.id, id),
  });
}

export async function deletePlatformLinkById(id: string) {
  await db.delete(athletePlatformLinks).where(eq(athletePlatformLinks.id, id));
}

// ── Sync ──────────────────────────────────────────────────────────────────────────

export async function findAllPlatformLinksForAthleteByProvider(
  athleteId: string,
  provider: string
) {
  return db.query.athletePlatformLinks.findMany({
    where: and(
      eq(athletePlatformLinks.athleteId, athleteId),
      eq(athletePlatformLinks.provider, provider as any)
    ),
  });
}

export async function updatePlatformLinkSyncData(
  linkId: string,
  data: PlatformSyncUpdate
) {
  await db
    .update(athletePlatformLinks)
    .set({
      rawData: data.rawData,
      ...(data.profileUrl !== undefined && { profileUrl: data.profileUrl }),
      reportState: data.reportState,
      lastSyncedAt: data.lastSyncedAt,
      updatedAt: new Date(),
    })
    .where(eq(athletePlatformLinks.id, linkId));
}

export async function updateAthleteAggregatedFields(
  athleteId: string,
  data: AthleteAggregatedFields
) {
  await db
    .update(athletes)
    .set({
      ...(data.description !== undefined && { description: data.description }),
      ...(data.isDescriptionAdded !== undefined && {
        isDescriptionAdded: data.isDescriptionAdded,
      }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.countryName !== undefined && { countryName: data.countryName }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.languages !== undefined && { languages: data.languages }),
      ...(data.emails !== undefined && { emails: data.emails }),
      ...(data.categories !== undefined && { categories: data.categories }),
      ...(data.healthConditions !== undefined && {
        healthConditions: data.healthConditions,
      }),
      updatedAt: new Date(),
      isActive: true,
    })
    .where(eq(athletes.id, athleteId));
}

export async function upsertAthleteMedia(
  platformLinkId: string,
  items: NormalizedMediaItem[]
) {
  for (const item of items) {
    await db
      .insert(athleteMedia)
      .values({
        platformLinkId,
        externalMediaId: item.externalMediaId,
        mediaType: item.mediaType,
        caption: item.caption,
        thumbnailUrl: item.thumbnailUrl,
        postedAt: item.postedAt,
        likesCount: item.likesCount,
        commentsCount: item.commentsCount,
        viewsCount: item.viewsCount,
        engagementRate: item.engagementRate as any,
        hashtags: item.hashtags,
        rawData: item.rawData,
      })
      .onConflictDoUpdate({
        target: [athleteMedia.platformLinkId, athleteMedia.externalMediaId],
        set: {
          caption: item.caption,
          likesCount: item.likesCount,
          commentsCount: item.commentsCount,
          viewsCount: item.viewsCount,
          engagementRate: item.engagementRate as any,
          hashtags: item.hashtags,
          rawData: item.rawData,
          updatedAt: new Date(),
        },
      });
  }
}

export async function findMediaByPlatformLinkIds(platformLinkIds: string[]) {
  if (!platformLinkIds.length) return [];
  return db.query.athleteMedia.findMany({
    where: inArray(athleteMedia.platformLinkId, platformLinkIds),
    orderBy: (media, { desc }) => [desc(media.postedAt)],
  });
}

export async function getResonanceSummary(athleteId: string) {
  const scores = await db.query.athleteResonanceScores.findMany({
    where: eq(athleteResonanceScores.athleteId, athleteId),
    with: {
      resonanceCondition: {
        columns: { id: true, name: true },
      },
    },
    orderBy: (s, { desc }) => [desc(s.score)],
  });

  if (!scores.length) {
    return { averageScore: 0, maxScore: 0, maxCondition: null, breakdown: [] };
  }

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const averageScore = Math.round(totalScore / scores.length);
  const topScore = scores[0];

  return {
    averageScore,
    maxScore: topScore.score,
    maxCondition: topScore.resonanceCondition?.name ?? null,
    breakdown: scores.map((s) => ({
      condition: s.resonanceCondition?.name,
      score: s.score,
    })),
  };
}


export async function upsertAthleteFinalScore(
  athleteId: string,
  data: {
    resonanceScore?: number;
    credibilityScore?: number;
    audienceTrustScore?: number;
    brandOverSafetyScore?: unknown;
    conditionAlignmentScore?: number;
    healthleteMatchScore?: number;
    weightDistribution?: unknown;
    scoreBreakdown?: unknown;    
  }
) {
  await db
    .insert(athleteFinalScores)
    .values({
      athleteId,
      ...data,
      calculatedAt: new Date(),
    } as any)
    .onConflictDoUpdate({
      target: athleteFinalScores.athleteId,
      set: {
        ...data,
        calculatedAt: new Date(),
        updatedAt: new Date(),
      } as any,
    });
}

export async function findAthleteFinalScore(athleteId: string) {
  return db.query.athleteFinalScores.findFirst({
    where: eq(athleteFinalScores.athleteId, athleteId),
  });
}

export async function deleteAthleteResonanceScores(athleteId: string) {
  await db
    .delete(athleteResonanceScores)
    .where(eq(athleteResonanceScores.athleteId, athleteId));
}