// core/condition-alignment/condition-alignment.repository.ts

import { db } from "../../../db";
import { resonanceConditions, athleteResonanceScores } from "../../../db/schema";
import { ilike, eq, and } from "drizzle-orm";

// ── Resonance condition dhundo by name (fuzzy) ────────────────────────────────
export async function findResonanceConditionByName(conditionName: string) {
  return db.query.resonanceConditions.findFirst({
    where: ilike(resonanceConditions.name, `%${conditionName}%`),
  });
}

// ── Saare resonance conditions dhundo jo name se match karein ─────────────────
export async function findAllResonanceConditionsByName(conditionName: string) {
  return db.query.resonanceConditions.findMany({
    where: ilike(resonanceConditions.name, `%${conditionName}%`),
  });
}

// ── Athlete ka resonance score nikalo for a specific condition ────────────────
export async function findAthleteResonanceScore(
  athleteId: string,
  resonanceConditionId: string
) {
  return db.query.athleteResonanceScores.findFirst({
    where: and(
      eq(athleteResonanceScores.athleteId, athleteId),
      eq(athleteResonanceScores.resonanceConditionId, resonanceConditionId)
    ),
  });
}

// ── Athlete ke saare resonance scores nikalo ──────────────────────────────────
export async function findAllAthleteResonanceScores(athleteId: string) {
  return db.query.athleteResonanceScores.findMany({
    where: eq(athleteResonanceScores.athleteId, athleteId),
    with: {
      resonanceCondition: true,
    },
  });
}