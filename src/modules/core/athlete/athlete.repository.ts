import { db } from "../../../db";
import { athletes, athleteHealthConditions } from "../../../db/schema";
import { eq, ilike, and, inArray, sql, count } from "drizzle-orm";
import { makeUniqueSlug } from "../../../utils/slug";
import { paginate } from "../../../utils/paginate.util";
import type {
  AthleteFilters,
  CreateAthleteDto,
  UpdateAthleteDto,
} from "./athlete.types";

export async function insertAthlete(data: CreateAthleteDto) {
  const slug = await makeUniqueSlug(
    `${data.firstName} ${data.lastName}`,
    athletes,
    athletes.slug
  );

  const [athlete] = await db
    .insert(athletes)
    .values({
      firstName: data.firstName,
      lastName: data.lastName,
      slug,
      country: data.country,
      description: data.description,
      avatarUrl: data.avatarUrl,
      tags: data.tags ?? [],
    })
    .returning();

  return athlete;
}

export async function insertAthleteHealthConditions(
  athleteId: string,
  healthConditionIds: string[]
) {
  if (!healthConditionIds.length) return;
  await db.insert(athleteHealthConditions).values(
    healthConditionIds.map((id) => ({
      athleteId,
      healthConditionId: id,
    }))
  );
}

export async function replaceAthleteHealthConditions(
  athleteId: string,
  healthConditionIds: string[]
) {
  await db
    .delete(athleteHealthConditions)
    .where(eq(athleteHealthConditions.athleteId, athleteId));

  if (healthConditionIds.length) {
    await db.insert(athleteHealthConditions).values(
      healthConditionIds.map((id) => ({
        athleteId,
        healthConditionId: id,
      }))
    );
  }
}

export async function findAthleteById(id: string) {
  return db.query.athletes.findFirst({
    where: eq(athletes.id, id),
    with: {
      healthConditions: {
        with: { healthCondition: true },
      },
    },
  });
}

function buildWhereConditions(filters: AthleteFilters, athleteIds?: string[]) {
  const conditions = [];

  if (filters.search) {
    conditions.push(
      sql`(${ilike(athletes.firstName, `%${filters.search}%`)} OR ${ilike(
        athletes.lastName,
        `%${filters.search}%`
      )})`
    );
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
    .where(
      inArray(athleteHealthConditions.healthConditionId, healthConditionIds)
    );

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
    with: filters.includeHealthConditions
      ? { healthConditions: { with: { healthCondition: true } } }
      : undefined,
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
  let extraIds: string[] | undefined;

  if (filters.healthConditionIds?.length) {
    extraIds = await getAthleteIds(filters.healthConditionIds);
    if (!extraIds.length) {
      return {
        items: [],
        total: 0,
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
        totalPages: 0,
      };
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
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.country !== undefined && { country: data.country }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      updatedAt: new Date(),
    })
    .where(eq(athletes.id, id))
    .returning();

  return updated;
}

export async function deleteAthleteById(id: string) {
  await db.delete(athletes).where(eq(athletes.id, id));
}
