import { Injectable } from "@nestjs/common";
import { and, asc, eq, ilike, sql, SQL } from "drizzle-orm";
import { db } from "../../../../database/drizzle";
import { campaignObjectives } from "../../../../database/drizzle/schema";
import {
  buildPaginationMeta,
  ListQuery,
  PaginatedResult,
} from "../../../../common/dto/pagination.dto";
import { AppError } from "../../../../common/exceptions/app.error";

@Injectable()
export class CampaignObjectiveRepository {
  async getAllCampaignObjectives() {
    return db
      .select({ id: campaignObjectives.id, name: campaignObjectives.name })
      .from(campaignObjectives)
      .where(eq(campaignObjectives.isActive, true));
  }

  private buildWhere(query: ListQuery): SQL | undefined {
    const conditions: SQL[] = [];
    if (query.search) conditions.push(ilike(campaignObjectives.name, `%${query.search}%`));
    if (query.isActive !== undefined) conditions.push(eq(campaignObjectives.isActive, query.isActive));
    return conditions.length ? and(...conditions) : undefined;
  }

  async findMany(query: ListQuery): Promise<PaginatedResult<typeof campaignObjectives.$inferSelect>> {
    const where = this.buildWhere(query);
    const offset = (query.page - 1) * query.limit;
    const [items, countRow] = await Promise.all([
      db.select().from(campaignObjectives).where(where).orderBy(asc(campaignObjectives.name)).limit(query.limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(campaignObjectives).where(where),
    ]);
    const total = countRow[0]?.count ?? 0;
    return { item: items, meta: buildPaginationMeta(query.page, query.limit, total) };
  }

  async findById(id: string) {
    const [item] = await db.select().from(campaignObjectives).where(eq(campaignObjectives.id, id)).limit(1);
    return item ?? null;
  }

  async create(data: { name: string; isActive?: boolean }) {
    const [item] = await db
      .insert(campaignObjectives)
      .values({ name: data.name.trim(), isActive: data.isActive ?? true })
      .returning();
    return item;
  }

  async update(id: string, data: { name?: string; isActive?: boolean }) {
    if (!(await this.findById(id))) throw new AppError(404, "Campaign objective not found", "NOT_FOUND");
    const [item] = await db
      .update(campaignObjectives)
      .set({ ...data, name: data.name?.trim(), updatedAt: new Date() })
      .where(eq(campaignObjectives.id, id))
      .returning();
    return item;
  }

  async deleteById(id: string) {
    if (!(await this.findById(id))) {
      throw new AppError(404, "Campaign objective not found", "NOT_FOUND");
    }

    const [item] = await db
      .delete(campaignObjectives)
      .where(eq(campaignObjectives.id, id))
      .returning();

    return item;
  }
}
