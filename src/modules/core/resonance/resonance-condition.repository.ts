import { db } from "../../../db";
import { resonanceConditions, athleteResonanceScores } from "../../../db/schema";
import { eq } from "drizzle-orm";
import type { ResonanceResult } from "./resonance-calculator";

export async function findResonanceConditionByName(name: string) {
  return db.query.resonanceConditions.findFirst({
    where: eq(resonanceConditions.name, name),
  });
}

export async function insertResonanceCondition(data: {
  name: string;
  keywords: string[];
  hashtags: string[];
}) {
  const [created] = await db.insert(resonanceConditions).values(data).returning();
  return created;
}

export async function saveAthleteResonanceScores(
  athleteId: string,
  results: ResonanceResult[]
) {
  for (const result of results) {
    await db
      .insert(athleteResonanceScores)
      .values({
        athleteId,
        resonanceConditionId: result.resonanceConditionId,
        score: result.score,
        matchedIn: result.matchedIn,
        calculatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [athleteResonanceScores.athleteId, athleteResonanceScores.resonanceConditionId],
        set: {
          score: result.score,
          matchedIn: result.matchedIn,
          calculatedAt: new Date(),
        },
      });
  }
}