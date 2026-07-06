import { and, count, eq, ilike, sql } from "drizzle-orm";
import { db } from "../../../db";
import type { LookupFilters } from "./lookup.types";
import { AppError } from "../../../middleware/errorHandler";
import { PgTableWithColumns } from "drizzle-orm/pg-core";

export function buildConditions(table: any, filters: LookupFilters) {
  const conditions = [];

  if (filters.isActive !== undefined) {
    conditions.push(eq(table.isActive, filters.isActive));
  }

  if (filters.search?.trim()) {
    conditions.push(ilike(table.name, `%${filters.search.trim()}%`));
  }

  return conditions;
}

export function buildSelectedFields(
  fieldMap: Record<string, any>,
  fields?: string[]
) {
  if (!fields?.length) {
    return {
      id: fieldMap.id,
      name: fieldMap.name,
    };
  }

  return Object.fromEntries(fields.map((field) => [field, fieldMap[field]]));
}

export async function getLookupData(
  table: any,
  fieldMap: Record<string, any>,
  filters: LookupFilters
) {
  const conditions = buildConditions(table, filters);

  const query = db
    .select(buildSelectedFields(fieldMap, filters.fields))
    .from(table)
    .where(conditions.length ? and(...conditions) : undefined);

  if (filters.page && filters.limit) {
    query.limit(filters.limit).offset((filters.page - 1) * filters.limit);
  }

  return query;
}

export async function getLookupCount(
  table: any,
  filters: LookupFilters
): Promise<number> {
  const conditions = buildConditions(table, filters);

  const [result] = await db
    .select({ count: count() })
    .from(table)
    .where(conditions.length ? and(...conditions) : undefined);

  return Number(result.count);
}


export async function createLookupItem(
  name: string,
  findByName: (name: string) => Promise<any>,
  create: (data: { name: string }) => Promise<any>,
  entityName: string
) {
  const trimmedName = name.trim();

  const existing = await findByName(trimmedName);

  if (existing) {
    throw new AppError(
      409,
      `${entityName} already exists`,
      "ALREADY_EXIST"
    );
  }

  return create({ name: trimmedName });
}

export async function findLookupByName(
  table: any,
  nameColumn: any,
  name: string
) {
  const [result] = await db
    .select()
    .from(table)
    .where(sql`LOWER(${nameColumn}) = LOWER(${name.trim()})`);

  return result;
}

export async function createLookup(
  table: PgTableWithColumns<any>,
  data: { name: string }
) {
  const [result] = await db
    .insert(table)
    .values(data)
    .returning();

  return result;
}