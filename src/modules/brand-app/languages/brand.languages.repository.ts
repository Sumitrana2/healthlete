import { db } from "../../../db";
import {  athleteLanguages, preferredChannels } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function getAllAthleteLanguages() {
  return await db
    .select({
      id: athleteLanguages.id,
      name: athleteLanguages.name,
      code: athleteLanguages.code,
    })
    .from(athleteLanguages)
    .where(eq(athleteLanguages.isActive, true));
}