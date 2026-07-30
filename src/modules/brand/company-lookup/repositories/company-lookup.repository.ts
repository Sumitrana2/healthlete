import { Injectable } from "@nestjs/common";
import { and, asc, eq, ilike, or, sql, SQL } from "drizzle-orm";
import { db } from "../../../../database/drizzle";
import { brands, companies, companySizes, industries } from "../../../../database/drizzle/schema";
import {
  buildPaginationMeta,
  ListQuery,
  PaginatedResult,
} from "../../../../common/dto/pagination.dto";
import { AppError } from "../../../../common/exceptions/app.error";

const companySelect = {
  id: companies.id,
  name: companies.name,
  website: companies.website,
  logoUrl: companies.logoUrl,
  description: companies.description,
  country: companies.country,
  industryId: companies.industryId,
  companySizeId: companies.companySizeId,
  createdAt: companies.createdAt,
  updatedAt: companies.updatedAt,
  industry: {
    id: industries.id,
    name: industries.name,
  },
  companySize: {
    id: companySizes.id,
    label: companySizes.label,
  },
};

@Injectable()
export class CompanyLookupRepository {
  private buildWhere(query: ListQuery): SQL | undefined {
    const conditions: SQL[] = [];
    if (query.search) {
      conditions.push(
        or(
          ilike(companies.name, `%${query.search}%`),
          ilike(companies.website, `%${query.search}%`)
        )!
      );
    }
    return conditions.length ? and(...conditions) : undefined;
  }

  async findMany(query: ListQuery) {
    const where = this.buildWhere(query);
    const offset = (query.page - 1) * query.limit;
    const [items, countRow] = await Promise.all([
      db
        .select(companySelect)
        .from(companies)
        .leftJoin(industries, eq(companies.industryId, industries.id))
        .leftJoin(companySizes, eq(companies.companySizeId, companySizes.id))
        .where(where)
        .orderBy(asc(companies.name))
        .limit(query.limit)
        .offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(companies).where(where),
    ]);
    const total = countRow[0]?.count ?? 0;
    return { item: items, meta: buildPaginationMeta(query.page, query.limit, total) };
  }

  async findById(id: string) {
    const [item] = await db
      .select(companySelect)
      .from(companies)
      .leftJoin(industries, eq(companies.industryId, industries.id))
      .leftJoin(companySizes, eq(companies.companySizeId, companySizes.id))
      .where(eq(companies.id, id))
      .limit(1);
    return item ?? null;
  }

  async create(data: {
    name: string;
    website?: string;
    logoUrl?: string;
    description?: string;
    country?: string;
    industryId?: string;
    companySizeId?: string;
  }) {
    await this.validateForeignKeys(data.industryId, data.companySizeId);
    const [item] = await db
      .insert(companies)
      .values({
        name: data.name.trim(),
        website: data.website,
        logoUrl: data.logoUrl,
        description: data.description,
        country: data.country,
        industryId: data.industryId,
        companySizeId: data.companySizeId,
      })
      .returning();
    return this.findById(item.id);
  }

  async update(
    id: string,
    data: {
      name?: string;
      website?: string | null;
      logoUrl?: string | null;
      description?: string | null;
      country?: string | null;
      industryId?: string | null;
      companySizeId?: string | null;
    }
  ) {
    if (!(await this.findById(id))) throw new AppError(404, "Company not found", "NOT_FOUND");
    if (data.industryId) await this.validateForeignKeys(data.industryId, undefined);
    if (data.companySizeId) await this.validateForeignKeys(undefined, data.companySizeId);

    await db
      .update(companies)
      .set({
        ...data,
        name: data.name?.trim(),
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id));
    return this.findById(id);
  }

  async remove(id: string) {
    if (!(await this.findById(id))) throw new AppError(404, "Company not found", "NOT_FOUND");
    const [brand] = await db.select({ id: brands.id }).from(brands).where(eq(brands.companyId, id)).limit(1);
    if (brand) throw new AppError(409, "Company is linked to a brand", "COMPANY_IN_USE");

    const [item] = await db.delete(companies).where(eq(companies.id, id)).returning();
    return item;
  }

  private async validateForeignKeys(industryId?: string, companySizeId?: string) {
    if (industryId) {
      const [industry] = await db.select({ id: industries.id }).from(industries).where(eq(industries.id, industryId)).limit(1);
      if (!industry) throw new AppError(400, "Invalid industry ID", "INVALID_INDUSTRY");
    }
    if (companySizeId) {
      const [size] = await db.select({ id: companySizes.id }).from(companySizes).where(eq(companySizes.id, companySizeId)).limit(1);
      if (!size) throw new AppError(400, "Invalid company size ID", "INVALID_COMPANY_SIZE");
    }
  }
}
