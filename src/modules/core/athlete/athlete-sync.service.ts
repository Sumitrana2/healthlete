import { AppError } from "../../../middleware/errorHandler";
import * as repository from "./athlete.repository";
import { AthletePlatformLink } from "./athlete.types";
import * as hyperAuditorClient from "../hyperauditor/hyperauditor.client";

export async function syncAthleteData(athleteId: string, provider: string) {
  const athlete = await repository.findAthleteById(athleteId);
  if (!athlete) throw new AppError(404, "Athlete not found");

  const links = await repository.findAllPlatformLinksForAthleteByProvider(
    athleteId,
    provider
  );

  if (!links.length) {
    throw new AppError(400, "No platform links found for this athlete");
  }

  const results = [];

  let description = athlete.description;
  let isDescriptionAdded = athlete.isDescriptionAdded;
  let country = athlete.country;
  let gender = athlete.gender;

  const languagesSet = new Set<string>((athlete.languages as string[]) ?? []);
  const emailsSet = new Set<string>((athlete.emails as string[]) ?? []);
  const categoriesSet = new Set<string>((athlete.categories as string[]) ?? []);
  try {
    await repository.upsertAthleteProvider(athleteId, provider, "syncing");
    for (const link of links) {
      try {
        const normalized = await syncSinglePlatformLink(link);

        await repository.updatePlatformLinkSyncData(link.id, {
          rawData: normalized.raw,
          profileUrl: normalized.profile_url ?? link.profileUrl,
          reportState: "ready",
          lastSyncedAt: new Date(),
        });

        if (!isDescriptionAdded && normalized.description) {
          description = normalized.description;
          isDescriptionAdded = true;
        }

        if (!country && normalized.country) {
          country = normalized.country;
        }

        if (!gender && normalized.gender) {
          gender = normalized.gender;
        }

        (normalized.languages ?? []).forEach((lang) => {
          if (lang) languagesSet.add(lang);
        });

        (normalized.emails ?? []).forEach((email) => {
          if (email) emailsSet.add(email);
        });

        (normalized.category ?? []).forEach((cat) => {
          if (cat) categoriesSet.add(cat);
        });

        results.push({ platform: link.platform, status: "success" });
      } catch (err) {
        await repository
          .updatePlatformLinkSyncData(link.id, {
            rawData: null,
            reportState: "failed",
            lastSyncedAt: new Date(),
          })
          .catch(() => {});

        results.push({
          platform: link.platform,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
    await repository.upsertAthleteProvider(athleteId, provider, "completed");

    await repository.updateAthleteAggregatedFields(athleteId, {
      description,
      isDescriptionAdded,
      country,
      gender,
      languages: Array.from(languagesSet),
      emails: Array.from(emailsSet),
      categories: Array.from(categoriesSet),
    });
  } catch (err) {
    await repository.upsertAthleteProvider(athleteId, provider, "failed");

  }
  return results;
}

async function syncSinglePlatformLink(link: AthletePlatformLink) {
  if (!link.providerSocialId) {
    throw new AppError(400, `Missing provider social id for ${link.platform}`);
  }

  return fetchFromProvider(link.provider, link.platform, link.providerSocialId);
}

async function fetchFromProvider(
  provider: string,
  platform: string,
  socialId: string
) {
  switch (provider) {
    case "hyperauditor":
      return fetchFromHyperAuditor(platform, socialId);
    default:
      throw new AppError(400, `Unsupported provider: ${provider}`);
  }
}

async function fetchFromHyperAuditor(platform: string, socialId: string) {
  switch (platform) {
    case "instagram":
      return hyperAuditorClient.fetchInstagramReport(socialId);
    case "youtube":
      return hyperAuditorClient.fetchYoutubeReport(socialId);
    case "twitter":
      return hyperAuditorClient.fetchTwitterReport(socialId);
    default:
      throw new AppError(
        400,
        `Unsupported platform for HyperAuditor: ${platform}`
      );
  }
}
