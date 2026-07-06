import { and, count, eq, ilike } from "drizzle-orm";
import { db } from "../../../db";
import type { LookupFilters } from "./lookup.types";

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
