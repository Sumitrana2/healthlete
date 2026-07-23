import { db } from "../../../db";
import { brands } from "../../../db/schema";
import { eq, ilike, and, or, count } from "drizzle-orm";
import { paginate } from "../../../utils/paginate.util";
import type { BrandFilters } from "./brand.types";

function buildWhereConditions(filters: BrandFilters) {
  const conditions = [];

  if (filters.search) {
    conditions.push(
      or(
        ilike(brands.firstName, `%${filters.search}%`),
        ilike(brands.lastName, `%${filters.search}%`),
        ilike(brands.email, `%${filters.search}%`)
      )
    );
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(brands.isActive, filters.isActive));
  }

  if (filters.approvalStatus) {
    conditions.push(eq(brands.approvalStatus, filters.approvalStatus as any));
  }

  if (filters.companyId) {
    conditions.push(eq(brands.companyId, filters.companyId));
  }

  return conditions.length ? and(...conditions) : undefined;
}

async function getData(
  filters: BrandFilters & { page: number; limit: number },
  where: ReturnType<typeof buildWhereConditions>
) {
  return db.query.brands.findMany({
    where,
    limit: filters.limit,
    offset: (filters.page - 1) * filters.limit,
    orderBy: (brands, { desc }) => [desc(brands.createdAt)],
    columns: {
      passwordHash: false, 
    },
    with: {
      company: {
        with: {
          industry: true,
          companySize: true,
        },
      },
    },
  });
}

async function getCount(where: ReturnType<typeof buildWhereConditions>): Promise<number> {
  const [{ total }] = await db.select({ total: count() }).from(brands).where(where);
  return Number(total);
}

export async function findBrands(filters: BrandFilters) {
  const where = buildWhereConditions(filters);

  return paginate(
    filters,
    (f) => getData(f, where),
    () => getCount(where)
  );
}

export async function findBrandById(id: string) {
  return db.query.brands.findFirst({
    where: eq(brands.id, id),
    columns: {
      passwordHash: false,
    },
    with: {
      company: {
        with: {
          industry: true,
          companySize: true,
        },
      },
      healthConditions: {
        with: { healthCondition: true },
      },
      campaignObjectives: {
        with: { campaignObjective: true },
      },
      preferredChannels: {
        with: { channel: true },
      },
      requiredLanguages: {
        with: { language: true },
      },
    },
  });
}

export async function updateBrandStatus(id: string, isActive: boolean) {
  const [updated] = await db
    .update(brands)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(brands.id, id))
    .returning();

  return updated;
}

export async function deleteBrandById(id: string) {
  await db.delete(brands).where(eq(brands.id, id));
}