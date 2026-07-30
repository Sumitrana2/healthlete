import { Injectable } from "@nestjs/common";
import { and, asc, eq, ilike, sql, SQL } from "drizzle-orm";
import { db } from "../../../database/drizzle";
import { athleteLanguages } from "../../../database/drizzle/schema";
import {
  buildPaginationMeta,
  ListQuery,
  PaginatedResult,
} from "../../../common/dto/pagination.dto";
import { AppError } from "../../../common/exceptions/app.error";

@Injectable()
export class LanguagesRepository {
  async getAllAthleteLanguages() {
    return db
      .select({
        id: athleteLanguages.id,
        name: athleteLanguages.name,
        code: athleteLanguages.code,
      })
      .from(athleteLanguages)
      .where(eq(athleteLanguages.isActive, true));
  }

  private buildWhere(query: ListQuery): SQL | undefined {
    const conditions: SQL[] = [];
    if (query.search) conditions.push(ilike(athleteLanguages.name, `%${query.search}%`));
    if (query.isActive !== undefined) conditions.push(eq(athleteLanguages.isActive, query.isActive));
    return conditions.length ? and(...conditions) : undefined;
  }

  async findMany(query: ListQuery): Promise<PaginatedResult<typeof athleteLanguages.$inferSelect>> {
    const where = this.buildWhere(query);
    const offset = (query.page - 1) * query.limit;

    const [items, countRow] = await Promise.all([
      db
        .select()
        .from(athleteLanguages)
        .where(where)
        .orderBy(asc(athleteLanguages.name))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(athleteLanguages)
        .where(where),
    ]);

    const total = countRow[0]?.count ?? 0;
    return { item: items, meta: buildPaginationMeta(query.page, query.limit, total) };
  }

  async findById(id: string) {
    const [item] = await db.select().from(athleteLanguages).where(eq(athleteLanguages.id, id)).limit(1);
    return item ?? null;
  }

  async create(data: { name: string; code: string; isActive?: boolean }) {
    const code = data.code.toLowerCase().trim();
    const [existing] = await db
      .select({ id: athleteLanguages.id })
      .from(athleteLanguages)
      .where(eq(athleteLanguages.code, code))
      .limit(1);
    if (existing) throw new AppError(409, "Language code already exists", "CODE_EXISTS");

    const [item] = await db
      .insert(athleteLanguages)
      .values({
        name: data.name.trim(),
        code,
        isActive: data.isActive ?? true,
      })
      .returning();
    return item;
  }

  async update(id: string, data: { name?: string; code?: string; isActive?: boolean }) {
    const existing = await this.findById(id);
    if (!existing) throw new AppError(404, "Language not found", "NOT_FOUND");

    if (data.code) {
      const code = data.code.toLowerCase().trim();
      const [duplicate] = await db
        .select({ id: athleteLanguages.id })
        .from(athleteLanguages)
        .where(eq(athleteLanguages.code, code))
        .limit(1);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(409, "Language code already exists", "CODE_EXISTS");
      }
      data.code = code;
    }

    const [item] = await db
      .update(athleteLanguages)
      .set({ ...data, name: data.name?.trim(), updatedAt: new Date() })
      .where(eq(athleteLanguages.id, id))
      .returning();
    return item;
  }

  async deleteById(id: string) {
    if (!(await this.findById(id))) {
      throw new AppError(404, "Language not found", "NOT_FOUND");
    }

    const [item] = await db
      .delete(athleteLanguages)
      .where(eq(athleteLanguages.id, id))
      .returning();

    return item;
  }
}
