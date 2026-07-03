import { db } from "../../../../db";
import {  industries } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export async function getAllIndustries() {
  return await db
    .select({
      id: industries.id,
      name: industries.name,
      // slug: industries.slug,
    })
    .from(industries)
    .where(eq(industries.isActive, true));
}