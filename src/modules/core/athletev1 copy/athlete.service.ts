import { AppError } from "../../../middleware/errorHandler";
import { deleteFileByUrl } from "../../../services/upload/upload.service";
import * as repository from "./athlete.repository";
import type {
  SyncAthleteDto,
  AthleteFilters,
  UpdateAthleteDto,
} from "./athlete.types";

export async function searchAthletes(query: string) {
  const url = new URL("https://hypeauditor.com/api/method/auditor.suggester");

  url.searchParams.set("search", query);
  url.searchParams.set("st", "");
  url.searchParams.set("exclSt", "");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-Auth-Id": process.env.HYPEAUDITOR_AUTH_ID!,
      "X-Auth-Token": process.env.HYPEAUDITOR_AUTH_TOKEN!,
    },
  });

  if (!response.ok) {
    throw new Error(`HypeAuditor API failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    result: {
      list: any[];
    };
  };
  
  return data.result.list;
}

export async function syncAthlete(data: SyncAthleteDto) {
  const { provider, platform, athleteId } = data;

  const existingLink = await repository.findExistingPlatformLink(
    provider,
    platform.platform,
    platform.social_id
  );

  if (existingLink && existingLink.athleteId !== athleteId) {
    throw new AppError(
      409,
      `This ${platform.platform} profile (${platform.username}) is already linked to athlete "${existingLink.athlete.fullName}"`
    );
  }

  let athlete;

  if (athleteId) {
    athlete = await repository.findAthleteById(athleteId);
    if (!athlete) throw new AppError(404, "Athlete not found");

    const alreadyLinked = await repository.findAthletePlatformLink(
      athleteId,
      platform.platform
    );
    if (alreadyLinked) {
      throw new AppError(
        400,
        `Athlete already has a ${platform.platform} profile linked`
      );
    }
  } else {
    athlete = await repository.insertAthleteForSync({
      fullName: platform.display_title,
      avatarUrl: platform.avatar_url ?? null,
    });
  }

  await repository.upsertAthleteProvider(athlete.id, provider);

  await repository.insertPlatformLink(athlete.id, provider, platform);

  const result = await repository.findAthleteWithRelations(athlete.id);
  if (!result) throw new AppError(500, "Athlete not found after sync");

  return result;
}

export async function searchExistingAthletes(name: string) {
  return repository.searchExistingAthletes(name);
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

export async function deleteAthlete(id: string) {
  const existing = await repository.findAthleteById(id);
  if (!existing) throw new AppError(404, "Athlete not found");

  if (existing.avatarUrl) {
    await deleteFileByUrl(existing.avatarUrl);
  }

  await repository.deleteAthleteById(id);
}
