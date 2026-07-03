import { db } from "../../../../db";
import { healthConditions } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export async function getAllHealthConditions() {
  return await db
    .select({
      id: healthConditions.id,
      name: healthConditions.name,
    })
    .from(healthConditions)
    .where(eq(healthConditions.isActive, true));
}