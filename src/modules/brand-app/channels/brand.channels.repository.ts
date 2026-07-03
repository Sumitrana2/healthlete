import { db } from "../../../db";
import {  preferredChannels } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function getAllPreferredChannels() {
  return await db
    .select({
      id: preferredChannels.id,
      name: preferredChannels.name,
    })
    .from(preferredChannels)
    .where(eq(preferredChannels.isActive, true));
}