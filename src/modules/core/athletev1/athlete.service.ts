import { AppError } from "../../../middleware/errorHandler";
import { deleteFileByUrl } from "../../../services/upload/upload.service";
import * as repository from "./athlete.repository";
import type {
  CreateAthleteWithPlatformDto,
  AddPlatformDto,
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
    throw new AppError(502, `HypeAuditor API failed: ${response.status}`);
  }

  const data = (await response.json()) as { result: { list: any[] } };
  return data.result.list;
}

// ── Create new athlete with first platform ────────────────────────────────────
export async function createAthleteWithPlatform(data: CreateAthleteWithPlatformDto) {
  const { provider, platform } = data;

  const existingLink = await repository.findExistingPlatformLink(
    provider,
    platform.platform,
    platform.social_id
  );

  if (existingLink) {
    throw new AppError(
      409,
      `This ${platform.platform} profile (${platform.username}) is already linked to athlete "${existingLink.athlete.fullName}"`
    );
  }
  const similarAthletes = await repository.searchExistingAthletes(platform.display_title);

  if (similarAthletes.length > 0 && !data.forceCreate) {
    return {
      requiresConfirmation: true,
      similarAthletes: similarAthletes.map((a) => ({
        id: a.id,
        fullName: a.fullName,
        avatarUrl: a.avatarUrl,
      })),
      athlete: null,
    };
  }
  const athlete = await repository.insertAthleteForSync({
    fullName: platform.display_title,
    avatarUrl: platform.avatar_url ?? null,
  });

  await repository.upsertAthleteProvider(athlete.id, provider);
  await repository.insertPlatformLink(athlete.id, provider, platform);

  const result = await repository.findAthleteWithRelations(athlete.id);
  if (!result) throw new AppError(500, "Athlete not found after creation");

  return {
    requiresConfirmation: false,
    similarAthletes: [],
    athlete: result,
  };
}

// ── Add platform to existing athlete ───────────────────────────────────────────
export async function addPlatformToAthlete(data: AddPlatformDto) {
  const { athleteId, provider, platform } = data;

  const athlete = await repository.findAthleteById(athleteId);
  if (!athlete) throw new AppError(404, "Athlete not found");

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

  const alreadyLinked = await repository.findAthletePlatformLink(
    athleteId,
    platform.platform
  );
  if (alreadyLinked) {
    throw new AppError(400, `Athlete already has a ${platform.platform} profile linked`);
  }

  await repository.upsertAthleteProvider(athleteId, provider);
  await repository.insertPlatformLink(athleteId, provider, platform);

  const result = await repository.findAthleteWithRelations(athleteId);
  if (!result) throw new AppError(500, "Athlete not found after update");

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

  await repository.updateAthleteById(id, data);

  if (data.healthConditionIds !== undefined) {
    await repository.replaceAthleteHealthConditions(id, data.healthConditionIds);
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

export async function deletePlatform(athleteId: string, linkId: string) {
  const athlete = await repository.findAthleteById(athleteId);
  if (!athlete) throw new AppError(404, "Athlete not found");

  const link = await repository.findPlatformLinkById(linkId);
  if (!link || link.athleteId !== athleteId) {
    throw new AppError(404, "Platform link not found for this athlete");
  }

  await repository.deletePlatformLinkById(linkId);
}