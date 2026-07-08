import { db } from "../../../db";
import { athletes } from "../../../db/schema";

import { eq } from "drizzle-orm";
import { athleteHealthConditions } from "../../../db/schema/athlete-health-conditions";
import { makeUniqueSlug } from "../../../utils/slug";
export async function insertAthlete(data: {
  fullName: string;
  country?: string;
  description?: string;
  avatarUrl?: string | null;
  tags?: string[];
}) {
  const slug = await makeUniqueSlug(data.fullName, athletes, athletes.slug);

  const [athlete] = await db
    .insert(athletes)
    .values({
      ...data,
      slug,
    })
    .returning();

  return athlete;
}

export async function insertAthleteHealthConditions(
  athleteId: string,
  healthConditionIds: string[]
) {
  if (!healthConditionIds.length) return;
  await db.insert(athleteHealthConditions).values(
    healthConditionIds.map((id) => ({
      athleteId,
      healthConditionId: id,
    }))
  );
}

export async function findAthleteById(id: string) {
  return db.query.athletes.findFirst({
    where: eq(athletes.id, id),
    with: {
      healthConditions: {
        with: {
          healthCondition: true,
        },
      },
    },
  });
}
