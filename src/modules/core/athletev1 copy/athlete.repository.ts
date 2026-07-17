import { db } from "../../../db";
import {
  athletes,
  athleteProviders,
  athletePlatformLinks,
  athleteHealthConditions,
} from "../../../db/schema";
import { eq, ilike, and, inArray, count } from "drizzle-orm";
import { makeUniqueSlug } from "../../../utils/slug";
import { paginate } from "../../../utils/paginate.util";
import type { AthleteFilters, SelectedPlatform, UpdateAthleteDto } from "./athlete.types";

// ---------- Sync flow ----------

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

export async function findAthletePlatformLink(athleteId: string, platform: string) {
  return db.query.athletePlatformLinks.findFirst({
    where: and(
      eq(athletePlatformLinks.athleteId, athleteId),
      eq(athletePlatformLinks.platform, platform as any)
    ),
  });
}

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
      isActive: false, // score/other platforms pending — admin-only tak
    })
    .returning();

  return athlete;
}

export async function upsertAthleteProvider(athleteId: string, provider: string) {
  await db
    .insert(athleteProviders)
    .values({
      athleteId,
      provider: provider as any,
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [athleteProviders.athleteId, athleteProviders.provider],
      set: { lastSyncedAt: new Date() },
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
      profileUrl: platform.avatar_url,
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
      healthConditions: { with: { healthCondition: true } },
    },
  });
}

export async function searchExistingAthletes(name: string) {
  return db.query.athletes.findMany({
    where: ilike(athletes.fullName, `%${name}%`),
    limit: 10,
    with: {
      platformLinks: { columns: { platform: true, username: true } },
    },
  });
}

// ---------- CRUD (fullName schema ke hisaab se updated) ----------

export async function findAthleteById(id: string) {
  return db.query.athletes.findFirst({
    where: eq(athletes.id, id),
    with: {
      platformLinks: true,
      healthConditions: { with: { healthCondition: true } },
    },
  });
}

function buildWhereConditions(filters: AthleteFilters, athleteIds?: string[]) {
  const conditions = [];

  if (filters.search) {
    conditions.push(ilike(athletes.fullName, `%${filters.search}%`));
  }
  if (filters.isActive !== undefined) {
    conditions.push(eq(athletes.isActive, filters.isActive));
  }
  if (athleteIds?.length) {
    conditions.push(inArray(athletes.id, athleteIds));
  }

  return conditions.length ? and(...conditions) : undefined;
}

async function getAthleteIds(healthConditionIds: string[]) {
  const rows = await db
    .selectDistinct({ athleteId: athleteHealthConditions.athleteId })
    .from(athleteHealthConditions)
    .where(inArray(athleteHealthConditions.healthConditionId, healthConditionIds));

  return rows.map((r) => r.athleteId);
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
      platformLinks: true,
      ...(filters.includeHealthConditions
        ? { healthConditions: { with: { healthCondition: true } } }
        : {}),
    },
  });
}

async function getCount(where: ReturnType<typeof buildWhereConditions>): Promise<number> {
  const [{ total }] = await db.select({ total: count() }).from(athletes).where(where);
  return Number(total);
}

export async function findAthletes(filters: AthleteFilters) {
  let extraIds: string[] | undefined;

  if (filters.healthConditionIds?.length) {
    extraIds = await getAthleteIds(filters.healthConditionIds);
    if (!extraIds.length) {
      return { items: [], total: 0, page: filters.page ?? 1, limit: filters.limit ?? 10, totalPages: 0 };
    }
  }

  const where = buildWhereConditions(filters, extraIds);

  return paginate(
    filters,
    (f) => getData(f, where),
    () => getCount(where)
  );
}

export async function updateAthleteById(id: string, data: UpdateAthleteDto) {
  const [updated] = await db
    .update(athletes)
    .set({
      ...(data.fullName !== undefined && { fullName: data.fullName }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(athletes.id, id))
    .returning();

  return updated;
}

export async function replaceAthleteHealthConditions(athleteId: string, healthConditionIds: string[]) {
  await db.delete(athleteHealthConditions).where(eq(athleteHealthConditions.athleteId, athleteId));

  if (healthConditionIds.length) {
    await db.insert(athleteHealthConditions).values(
      healthConditionIds.map((id) => ({ athleteId, healthConditionId: id }))
    );
  }
}

export async function deleteAthleteById(id: string) {
  await db.delete(athletes).where(eq(athletes.id, id));
}