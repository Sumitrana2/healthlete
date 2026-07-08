import { AppError } from "../../../middleware/errorHandler";
import * as repository from "./admin.athlete.repository";

export async function createAthlete(data: {
  fullName: string;
  country?: string;
  description?: string;
  tags?: string[];
  healthConditionIds?: string[];
  avatarUrl?: string | null;
}) {
  const athlete = await repository.insertAthlete({
    fullName: data.fullName,
    country: data.country,
    description: data.description,
    avatarUrl: data.avatarUrl,
    tags: data.tags ?? [],
  });

  if (data.healthConditionIds?.length) {
    await repository.insertAthleteHealthConditions(
      athlete.id,
      data.healthConditionIds
    );
  }

  const result = await repository.findAthleteById(athlete.id);
  if (!result) throw new AppError(500, "thlete not found after creation");

  return result;
}
