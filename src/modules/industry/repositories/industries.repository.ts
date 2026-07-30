import { Injectable } from "@nestjs/common";
import { and, asc, eq, ilike, sql, SQL } from "drizzle-orm";
import { db } from "../../../database/drizzle";
import { industries } from "../../../database/drizzle/schema";
import {
  buildPaginationMeta,
  ListQuery,
  PaginatedResult,
} from "../../../common/dto/pagination.dto";
import { AppError } from "../../../common/exceptions/app.error";
import { makeUniqueSlug } from "../../../common/utils/slug";

@Injectable()
export class IndustriesRepository {
  async getAllIndustries() {
    return db
      .select({ id: industries.id, name: industries.name })
      .from(industries)
      .where(eq(industries.isActive, true));
  }

  private buildWhere(query: ListQuery): SQL | undefined {
    const conditions: SQL[] = [];
    if (query.search) conditions.push(ilike(industries.name, `%${query.search}%`));
    if (query.isActive !== undefined) conditions.push(eq(industries.isActive, query.isActive));
    return conditions.length ? and(...conditions) : undefined;
  }

  async findMany(query: ListQuery): Promise<PaginatedResult<typeof industries.$inferSelect>> {
    const where = this.buildWhere(query);
    const offset = (query.page - 1) * query.limit;
    const [items, countRow] = await Promise.all([
      db.select().from(industries).where(where).orderBy(asc(industries.name)).limit(query.limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(industries).where(where),
    ]);
    const total = countRow[0]?.count ?? 0;
    return { item: items, meta: buildPaginationMeta(query.page, query.limit, total) };
  }

  async findById(id: string) {
    const [item] = await db.select().from(industries).where(eq(industries.id, id)).limit(1);
    return item ?? null;
  }

  async create(data: { name: string; isActive?: boolean }) {
    const name = data.name.trim();
    const slug = await makeUniqueSlug(name, industries, industries.slug);
    const [item] = await db
      .insert(industries)
      .values({ name, slug, isActive: data.isActive ?? true })
      .returning();
    return item;
  }

  async update(id: string, data: { name?: string; isActive?: boolean }) {
    const existing = await this.findById(id);
    if (!existing) throw new AppError(404, "Industry not found", "NOT_FOUND");

    const patch: Partial<typeof industries.$inferInsert> = {
      isActive: data.isActive,
      updatedAt: new Date(),
    };
    if (data.name) {
      patch.name = data.name.trim();
      const baseSlug = data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (baseSlug !== existing.slug) {
        patch.slug = await makeUniqueSlug(data.name, industries, industries.slug);
      }
    }
    const [item] = await db.update(industries).set(patch).where(eq(industries.id, id)).returning();
    return item;
  }

  async deleteById(id: string) {
    if (!(await this.findById(id))) {
      throw new AppError(404, "Industry not found", "NOT_FOUND");
    }

    // Node parity: hard delete (companies.industry_id is ON DELETE SET NULL)
    const [item] = await db
      .delete(industries)
      .where(eq(industries.id, id))
      .returning();

    return item;
  }
}
