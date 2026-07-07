import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
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
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(table.createdAt));


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
    throw new AppError(409, `${entityName} already exists`, "ALREADY_EXIST");
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
  const [result] = await db.insert(table).values(data).returning();

  return result;
}

export async function updateLookupItem(
  id: string,
  name: string,
  findById: (id: string) => Promise<any>,
  findByName: (name: string) => Promise<any>,
  update: (id: string, data: { name: string }) => Promise<any>,
  entityName: string
) {
  const existing = await findById(id);

  if (!existing) {
    throw new AppError(404, `${entityName} not found`, "NOT_FOUND");
  }
  const trimmedName = name.trim();
  const duplicate = await findByName(trimmedName);

  if (duplicate && duplicate.id !== id) {
    throw new AppError(409, `${entityName} already exists`, "ALREADY_EXIST");
  }

  return update(id, {
    name: trimmedName,
  });
}

export async function findLookupById(
  table: any,
  idColumn: any,
  id: string
) {
  const [result] = await db
    .select()
    .from(table)
    .where(eq(idColumn, id));

  return result;
}

export async function updateLookup<
  TTable extends PgTableWithColumns<any>,
  TData extends Record<string, unknown>
>(
  table: TTable,
  idColumn: TTable["_"]["columns"]["id"],
  id: string,
  data: TData
) {
  const [result] = await db
    .update(table)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(idColumn, id))
    .returning();

  return result;
}

export async function deleteLookupItem(
  id: string,
  findById: (id: string) => Promise<any>,
  remove: (id: string) => Promise<any>,
  entityName: string
) {
  const item = await findById(id);

  if (!item) {
    throw new AppError(404, `${entityName} not found`, "NOT_FOUND");
  }

  // Future Enhancement:
  // const linked = await hasReference(id);
  // if (linked) {
  //   throw new AppError(
  //     409,
  //     `${entityName} is in use and cannot be deleted`,
  //     "ALREADY_IN_USE"
  //   );
  // }

  return remove(id);
}

export async function deleteLookup(
  table: PgTableWithColumns<any>,
  idColumn: any,
  id: string
) {
  const [result] = await db
    .delete(table)
    .where(eq(idColumn, id))
    .returning();

  return result;
}

