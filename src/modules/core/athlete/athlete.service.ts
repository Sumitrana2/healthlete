import { AppError } from "../../../middleware/errorHandler";
import { deleteFileByUrl } from "../../../services/upload/upload.service";
import * as repository from "./athlete.repository";
import type {
  AthleteFilters,
  CreateAthleteDto,
  UpdateAthleteDto,
} from "./athlete.types";

export async function createAthlete(data: CreateAthleteDto) {
  const athlete = await repository.insertAthlete(data);

  if (data.healthConditionIds?.length) {
    await repository.insertAthleteHealthConditions(
      athlete.id,
      data.healthConditionIds
    );
  }

  const result = await repository.findAthleteById(athlete.id);
  if (!result) throw new AppError(500, "Athlete not found after creation");

  return result;
}

export async function getAthletes(filters: AthleteFilters) {
  return repository.findAthletes(filters);
}

export async function getAthleteById(id: string) {
  const athlete = await repository.findAthleteById(id);
  if (!athlete) throw new AppError(404, "Athlete not found");
  return athlete;
}

export async function updateAthlete(id: string, data: UpdateAthleteDto) {
  const existing = await repository.findAthleteById(id);
  if (!existing) throw new AppError(404, "Athlete not found");
  if (data.avatarUrl && existing.avatarUrl) {
    await deleteFileByUrl(existing.avatarUrl);
  }
  await repository.updateAthleteById(id, data);
  if (data.healthConditionIds !== undefined) {
    await repository.replaceAthleteHealthConditions(
      id,
      data.healthConditionIds
    );
  }

  const result = await repository.findAthleteById(id);
  if (!result) throw new AppError(500, "Athlete not found after update");

  return result;
}
