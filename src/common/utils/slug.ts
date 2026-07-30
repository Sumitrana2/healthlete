import { db } from "../../database/drizzle";
import { eq } from "drizzle-orm";
import { PgTable, PgColumn } from "drizzle-orm/pg-core";

export function generateBaseSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function makeUniqueSlug(
  base: string,
  table: PgTable,
  slugColumn: PgColumn,
  excludeId?: string,
): Promise<string> {
  let slug = generateBaseSlug(base);
  let counter = 1;

  while (true) {
    const [existing] = await db
      .select({ id: (table as any).id })
      .from(table)
      .where(eq(slugColumn, slug))
      .limit(1);

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    slug = `${generateBaseSlug(base)}-${counter}`;
    counter++;
  }
}
