import { Injectable } from "@nestjs/common";
import { and, asc, eq, ilike, sql, SQL } from "drizzle-orm";
import { db } from "../../../database/drizzle";
import { preferredChannels } from "../../../database/drizzle/schema";
import {
  buildPaginationMeta,
  ListQuery,
  PaginatedResult,
} from "../../../common/dto/pagination.dto";
import { AppError } from "../../../common/exceptions/app.error";

@Injectable()
export class ChannelsRepository {
  async getAllPreferredChannels() {
    return db
      .select({ id: preferredChannels.id, name: preferredChannels.name })
      .from(preferredChannels)
      .where(eq(preferredChannels.isActive, true));
  }

  private buildWhere(query: ListQuery): SQL | undefined {
    const conditions: SQL[] = [];
    if (query.search) conditions.push(ilike(preferredChannels.name, `%${query.search}%`));
    if (query.isActive !== undefined) conditions.push(eq(preferredChannels.isActive, query.isActive));
    return conditions.length ? and(...conditions) : undefined;
  }

  async findMany(query: ListQuery): Promise<PaginatedResult<typeof preferredChannels.$inferSelect>> {
    const where = this.buildWhere(query);
    const offset = (query.page - 1) * query.limit;
    const [items, countRow] = await Promise.all([
      db.select().from(preferredChannels).where(where).orderBy(asc(preferredChannels.name)).limit(query.limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(preferredChannels).where(where),
    ]);
    const total = countRow[0]?.count ?? 0;
    return { item: items, meta: buildPaginationMeta(query.page, query.limit, total) };
  }

  async findById(id: string) {
    const [item] = await db.select().from(preferredChannels).where(eq(preferredChannels.id, id)).limit(1);
    return item ?? null;
  }

  async create(data: { name: string; isActive?: boolean }) {
    const [item] = await db
      .insert(preferredChannels)
      .values({ name: data.name.trim(), isActive: data.isActive ?? true })
      .returning();
    return item;
  }

  async update(id: string, data: { name?: string; isActive?: boolean }) {
    if (!(await this.findById(id))) throw new AppError(404, "Channel not found", "NOT_FOUND");
    const [item] = await db
      .update(preferredChannels)
      .set({ ...data, name: data.name?.trim(), updatedAt: new Date() })
      .where(eq(preferredChannels.id, id))
      .returning();
    return item;
  }

  async deleteById(id: string) {
    if (!(await this.findById(id))) {
      throw new AppError(404, "Channel not found", "NOT_FOUND");
    }

    const [item] = await db
      .delete(preferredChannels)
      .where(eq(preferredChannels.id, id))
      .returning();

    return item;
  }
}
