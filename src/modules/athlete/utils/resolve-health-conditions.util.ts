import { inArray } from "drizzle-orm";
import { db } from "../../../database/drizzle";
import { healthConditions } from "../../../database/drizzle/schema";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ResolvedHealthCondition = {
  id: string;
  name: string;
};

export async function resolveHealthConditionValues(
  values: string[] | null | undefined,
): Promise<ResolvedHealthCondition[]> {
  if (!values?.length) {
    return [];
  }

  const unique = [...new Set(values.map((value) => value.trim()).filter(Boolean))];
  const ids = unique.filter((value) => UUID_RE.test(value));

  const byId = new Map<string, string>();
  if (ids.length > 0) {
    const rows = await db
      .select({ id: healthConditions.id, name: healthConditions.name })
      .from(healthConditions)
      .where(inArray(healthConditions.id, ids));

    for (const row of rows) {
      byId.set(row.id, row.name);
    }
  }

  const resolved: ResolvedHealthCondition[] = [];
  const seen = new Set<string>();

  for (const value of unique) {
    if (seen.has(value)) continue;
    seen.add(value);

    if (UUID_RE.test(value)) {
      const name = byId.get(value);
      if (!name) continue;
      resolved.push({ id: value, name });
      continue;
    }

    resolved.push({ id: value, name: value });
  }

  return resolved;
}
