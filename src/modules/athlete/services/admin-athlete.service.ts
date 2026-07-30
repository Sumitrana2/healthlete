import { Injectable } from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";
import { ListQuery } from "../../../common/dto/pagination.dto";
import { AppError } from "../../../common/exceptions/app.error";
import { db } from "../../../database/drizzle";
import { healthConditions } from "../../../database/drizzle/schema";
import {
  AddPlatformsInput,
  CreateManualAthleteInput,
  SyncPlatformInput,
  UpdateManualAthleteInput,
  syncPlatformToAddPlatforms,
} from "../dto/admin-athlete.dto";
import { AthleteRepository } from "../repositories/athlete.repository";
import { HypeAuditorService } from "../../../integrations/hypeauditor/hypeauditor.service";
import { AthleteSyncService } from "./athlete-sync.service";
import { UploadService } from "../../../shared/storage/upload.service";
import { normalizePlatform } from "../utils/platform-link.util";
import type {
  HypeAuditorPlatform,
  HypeAuditorSuggesterItem,
} from "../../../integrations/hypeauditor/types/hypeauditor.types";
import logger from "../../../shared/logger/logger";

function normalizeStr(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function filterAndRankSearchResults(
  items: HypeAuditorSuggesterItem[],
  rawQuery: string,
): HypeAuditorSuggesterItem[] {
  const query = normalizeStr(rawQuery);
  if (!query) return items;

  const queryWords = rawQuery
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  return items
    .map((item) => {
      const normUsername = normalizeStr(item.username);
      const normTitle = normalizeStr(item.title);
      const titleLower = item.title.toLowerCase();

      const isExactUsername = normUsername === query;
      const isExactTitle = normTitle === query;

      const titleHasAllWords =
        queryWords.length > 0 &&
        queryWords.every((word) => titleLower.includes(word));

      if (!item.is_verified) return null;

      if (!isExactUsername && !isExactTitle && !titleHasAllWords) {
        return null;
      }

      let score = 0;
      if (item.is_verified) score += 10000;
      if (isExactUsername) score += 5000;
      if (isExactTitle) score += 3000;
      if (titleHasAllWords) score += 1000;
      score += Math.min(item.subscribers_count, 100_000_000) / 100_000;

      return { item, score };
    })
    .filter(
      (entry): entry is { item: HypeAuditorSuggesterItem; score: number } =>
        entry !== null,
    )
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

@Injectable()
export class AdminAthleteService {
  constructor(
    private readonly hypeAuditorService: HypeAuditorService,
    private readonly athleteRepository: AthleteRepository,
    private readonly athleteSyncService: AthleteSyncService,
    private readonly uploadService: UploadService,
  ) {}

  async search(search: string, st?: string, exclSt?: string) {
    const rawResults = await this.hypeAuditorService.searchAthletes(
      search,
      st,
      exclSt,
    );
    return filterAndRankSearchResults(rawResults, search);
  }

  searchExisting(name: string) {
    return this.athleteRepository.searchExistingByName(name);
  }

  list(query: ListQuery) {
    return this.athleteRepository.findMany(query);
  }

  getById(id: string) {
    return this.athleteRepository.findById(id);
  }

  private async validateHealthConditionIds(ids: string[]) {
    const uniqueIds = [...new Set(ids)];
    if (!uniqueIds.length) {
      return;
    }

    const rows = await db
      .select({ id: healthConditions.id })
      .from(healthConditions)
      .where(
        and(
          inArray(healthConditions.id, uniqueIds),
          eq(healthConditions.isActive, true),
        ),
      );

    if (rows.length !== uniqueIds.length) {
      throw new AppError(
        400,
        "Invalid health condition ids",
        "VALIDATION_ERROR",
      );
    }
  }

  private async resolveCreatorProfile(accounts: AddPlatformsInput["accounts"]) {
    const creatorAccounts = accounts
      .map((account) => {
        const socialType = normalizePlatform(account.type);
        if (!socialType || !account.user_id?.trim()) {
          return null;
        }

        return {
          social_type: socialType,
          social_id: account.user_id.trim(),
        };
      })
      .filter(
        (
          account,
        ): account is { social_type: HypeAuditorPlatform; social_id: string } =>
          account !== null,
      );

    if (creatorAccounts.length === 0) {
      return null;
    }

    try {
      const creators =
        await this.hypeAuditorService.getCreatorsByAccounts(creatorAccounts);
      return creators[0] ?? null;
    } catch (error) {
      logger.error(
        { error, creatorAccounts },
        "Failed to resolve HypeAuditor creator profile",
      );
      return null;
    }
  }

  async createManual(
    input: CreateManualAthleteInput,
    uploadedFile?: Express.Multer.File,
  ) {
    let avatarUrl: string | undefined;

    if (uploadedFile) {
      avatarUrl = this.uploadService.buildFileResult(
        uploadedFile,
        "athletes",
      ).url;
    } else {
      avatarUrl = await this.uploadService.resolveAvatarUrl(
        input.image ?? input.avatar_url,
        "athletes",
      );
    }

    if (!avatarUrl) {
      throw new AppError(400, "image: Required", "VALIDATION_ERROR", {
        image: ["Required"],
      });
    }

    await this.validateHealthConditionIds(input.health_conditions ?? []);

    return this.athleteRepository.createManual({
      ...input,
      avatar_url: avatarUrl,
    });
  }

  async createFromSyncPlatform(input: SyncPlatformInput) {
    return this.createFromSearch(syncPlatformToAddPlatforms(input));
  }

  async updateManual(
    id: string,
    input: UpdateManualAthleteInput,
    uploadedFile?: Express.Multer.File,
  ) {
    const existing = await this.athleteRepository.findById(id);
    if (!existing) {
      return null;
    }

    if (input.health_conditions !== undefined) {
      await this.validateHealthConditionIds(input.health_conditions);
    }

    let avatarUrl: string | undefined;

    if (uploadedFile) {
      avatarUrl = this.uploadService.buildFileResult(
        uploadedFile,
        "athletes",
      ).url;
      await this.uploadService.deleteFileByUrl(existing.avatarUrl);
    } else if (input.image || input.avatar_url) {
      avatarUrl = await this.uploadService.resolveAvatarUrl(
        input.image ?? input.avatar_url,
        "athletes",
      );
      if (avatarUrl && avatarUrl !== existing.avatarUrl) {
        await this.uploadService.deleteFileByUrl(existing.avatarUrl);
      }
    }

    const updated = await this.athleteRepository.updateManual(id, {
      ...input,
      ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    });

    if (!updated) {
      return null;
    }

    return { athlete: updated };
  }

  async addPlatformsToAthlete(athleteId: string, input: AddPlatformsInput) {
    const creatorProfile = await this.resolveCreatorProfile(input.accounts);

    return this.athleteRepository.addPlatformsToAthlete(
      athleteId,
      input,
      creatorProfile,
    );
  }

  async addSyncPlatformToAthlete(athleteId: string, input: SyncPlatformInput) {
    return this.addPlatformsToAthlete(
      athleteId,
      syncPlatformToAddPlatforms(input),
    );
  }

  async createFromSearch(input: AddPlatformsInput) {
    const creatorProfile = await this.resolveCreatorProfile(input.accounts);

    return this.athleteRepository.createFromSelectedAccounts(
      input,
      creatorProfile,
    );
  }

  async backfillMissingCreatorRaw() {
    return this.athleteRepository.backfillMissingCreatorRaw((accounts) =>
      this.hypeAuditorService.getCreatorsByAccounts(accounts),
    );
  }

  async remove(id: string) {
    const athlete = await this.athleteRepository.findById(id);
    if (!athlete) {
      return null;
    }

    await this.uploadService.deleteFileByUrl(athlete.avatarUrl);
    return this.athleteRepository.deleteById(id);
  }

  async removePlatform(athleteId: string, linkId: string) {
    const athlete = await this.athleteRepository.deletePlatformLink(
      athleteId,
      linkId,
    );
    if (!athlete) {
      throw new AppError(404, "Platform link not found", "NOT_FOUND");
    }
    return { athlete };
  }

  async syncAthlete(id: string) {
    const result = await this.athleteSyncService.forceSyncAthlete(id);
    return result;
  }
}
