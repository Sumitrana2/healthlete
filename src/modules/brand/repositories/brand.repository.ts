import { Injectable } from "@nestjs/common";
import { db } from "../../../database/drizzle";
import {
  brands,
  refreshTokens,
  authLogs,
  appSettings,
} from "../../../database/drizzle/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { platformTaxonomy, brandTaxonomySelections } from "../../../database/drizzle/schema";
import { inArray } from "drizzle-orm";
import { AUTH } from "../../../common/constants/app.constants";

@Injectable()
export class BrandRepository {
async findBrandByEmail(email: string) {
  const [brand] = await db.select().from(brands).where(eq(brands.email, email));
  return brand ?? null;
}

  async findBrandIdByEmail(email: string) {
  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.email, email));
  return brand ?? null;
}

  async insertBrand(values: typeof brands.$inferInsert) {
  const [brand] = await db.insert(brands).values(values).returning();
  return brand;
}

  async updateBrandByEmail(
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
  async insertRefreshToken(values: {
  brandId: string;
  token: string;
  expiresAt: Date;
  deviceInfo?: { ip?: string; userAgent?: string };
}) {
  const [row] = await db.insert(refreshTokens).values(values).returning();
  return row;
}

  async findActiveRefreshToken(token: string) {
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

  async countActiveSessions(brandId: string) {
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

  async revokeOldestSession(brandId: string) {
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

  async revokeRefreshTokenById(id: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.id, id));
}

  async revokeAllBrandSessions(brandId: string) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.brandId, brandId));
}

  async getActiveSessions(brandId: string) {
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

  async getMaxSessions(): Promise<number> {
  const [setting] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "brand_max_sessions"));
  return setting ? Number(setting.value) : AUTH.MAX_SESSIONS;
}

  async insertAuthLog(values: typeof authLogs.$inferInsert) {
  await db.insert(authLogs).values(values);
}

  async findTaxonomyIdsByExternalIds(externalIds: number[]) {
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
  async insertTaxonomySelections(
  brandId: string,
  taxonomyIds: string[]
) {
  if (!taxonomyIds.length) return;

  await db
    .insert(brandTaxonomySelections)
    .values(taxonomyIds.map((taxonomyId) => ({ brandId, taxonomyId })))
    .onConflictDoNothing();
}

  async incrementFailedAttempts(email: string) {
  const [brand] = await db
    .update(brands)
    .set({
      failedLoginAttempts: sql`${brands.failedLoginAttempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(brands.email, email))
    .returning();
  return brand;
}

  async resetFailedAttempts(email: string) {
  await db
    .update(brands)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: new Date(),
    })
    .where(eq(brands.email, email));
}

  async lockAccount(email: string, until: Date) {
  await db
    .update(brands)
    .set({
      lockedUntil: until,
      updatedAt: new Date(),
    })
    .where(eq(brands.email, email));
}
}
