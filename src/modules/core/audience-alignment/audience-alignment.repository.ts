// core/audience-alignment/audience-alignment.repository.ts

import { db } from "../../../db";
import { athleteResonanceScores } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function findAllAthleteResonanceScores(athleteId: string) {
  return db.query.athleteResonanceScores.findMany({
    where: eq(athleteResonanceScores.athleteId, athleteId),
    with: {
      resonanceCondition: true,
    },
  });
}