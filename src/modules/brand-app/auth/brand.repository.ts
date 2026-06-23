import { db } from "../../../db";
import {
  brands,
  refreshTokens,
  authLogs,
  appSettings,
} from "../../../db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { platformTaxonomy, brandTaxonomySelections } from "../../../db/schema";
import { inArray } from "drizzle-orm";

export async function findBrandByEmail(email: string) {
  const [brand] = await db.select().from(brands).where(eq(brands.email, email));
  return brand ?? null;
}

export async function findBrandIdByEmail(email: string) {
  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.email, email));
  return brand ?? null;
}

export async function insertBrand(values: typeof brands.$inferInsert) {
  const [brand] = await db.insert(brands).values(values).returning();
  return brand;
}

export async function updateBrandByEmail(
  email: string,
  values: Partial<typeof brands.$inferInsert>
) {
  const [updated] = await db
    .update(brands)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(brands.email, email))
    .returning();
  return updated;
}
export async function insertRefreshToken(values: {
  brandId: string;
  token: string;
  expiresAt: Date;
  deviceInfo?: { ip?: string; userAgent?: string };
}) {
  const [row] = await db.insert(refreshTokens).values(values).returning();
  return row;
}

export async function findActiveRefreshToken(token: string) {
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.token, token),
        isNull(refreshTokens.revokedAt),
        sql`${refreshTokens.expiresAt} > NOW()`
      )
    );
  return row ?? null;
}

export async function countActiveSessions(brandId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.brandId, brandId),
        isNull(refreshTokens.revokedAt),
        sql`${refreshTokens.expiresAt} > NOW()`
      )
    );
  return result.count;
}

export async function revokeOldestSession(brandId: string) {
  const [oldest] = await db
    .select({ id: refreshTokens.id })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.brandId, brandId),
        isNull(refreshTokens.revokedAt),
        sql`${refreshTokens.expiresAt} > NOW()`
      )
    )
    .orderBy(refreshTokens.createdAt)
    .limit(1);

  if (oldest) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, oldest.id));
  }
}

export async function revokeRefreshTokenById(id: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, id));
}

export async function revokeAllBrandSessions(brandId: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.brandId, brandId));
}

export async function getActiveSessions(brandId: string) {
  return db
    .select({
      id: refreshTokens.id,
      deviceInfo: refreshTokens.deviceInfo,
      createdAt: refreshTokens.createdAt,
      expiresAt: refreshTokens.expiresAt,
    })
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.brandId, brandId),
        isNull(refreshTokens.revokedAt),
        sql`${refreshTokens.expiresAt} > NOW()`
      )
    );
}

export async function getMaxSessions(): Promise<number> {
  const [setting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "brand_max_sessions"));
  return setting ? Number(setting.value) : 3;
}

export async function insertAuthLog(values: typeof authLogs.$inferInsert) {
  await db.insert(authLogs).values(values);
}



export async function findTaxonomyIdsByExternalIds(externalIds: number[]) {
  if (!externalIds.length) return [];

  const igCategories = await db
    .select({ id: platformTaxonomy.id, title: platformTaxonomy.title })
    .from(platformTaxonomy)
    .where(
      and(
        eq(platformTaxonomy.platform, "ig"),
        eq(platformTaxonomy.kind, "category"),
        inArray(platformTaxonomy.externalId, externalIds)
      )
    );

  if (!igCategories.length) return [];

  const firstWords = igCategories.map((r) =>
    r.title.trim().split(/\s+/)[0].toLowerCase()
  );

  const igCategoryIds = igCategories.map((r) => r.id);

  const relatedTaxonomies = await db
    .select({
      id: platformTaxonomy.id,
      title: platformTaxonomy.title,
    })
    .from(platformTaxonomy);

  const matchedIds = relatedTaxonomies
    .filter((row) => {
      const firstWord = row.title.trim().split(/\s+/)[0].toLowerCase();
      return firstWords.includes(firstWord);
    })
    .map((row) => row.id);

  return [...new Set([...igCategoryIds, ...matchedIds])];
}
export async function insertTaxonomySelections(
  brandId: string,
  taxonomyIds: string[]
) {
  if (!taxonomyIds.length) return;

  await db
    .insert(brandTaxonomySelections)
    .values(taxonomyIds.map((taxonomyId) => ({ brandId, taxonomyId })))
    .onConflictDoNothing();
}
