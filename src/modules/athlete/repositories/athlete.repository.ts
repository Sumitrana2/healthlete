import { Injectable } from "@nestjs/common";
import { and, asc, desc, eq, ilike, inArray, or, sql, SQL } from "drizzle-orm";
import { db } from "../../../database/drizzle";
import {
  athletes,
  athletePlatformLinks,
  athleteProviders,
  athleteFinalScores,
  athleteResonanceScores,
  resonanceConditions,
  instagramRawData,
  instagramScores,
  youtubeRawData,
  youtubeScores,
  twitterRawData,
  twitterScores,
} from "../../../database/drizzle/schema";
import {
  buildPaginationMeta,
  ListQuery,
} from "../../../common/dto/pagination.dto";
import { AppError } from "../../../common/exceptions/app.error";
import { makeUniqueSlug } from "../../../common/utils/slug";
import {
  AddPlatformsInput,
  CreateManualAthleteInput,
  SelectedAthleteAccountInput,
  UpdateManualAthleteInput,
} from "../dto/admin-athlete.dto";
import {
  HypeAuditorCreator,
  HypeAuditorPlatform,
} from "../../../integrations/hypeauditor/types/hypeauditor.types";
import { enrichAthleteWithSync } from "../utils/athlete-sync.util";
import {
  mapFinalScoreToNodeShape,
  mapPlatformLinkToNodeShape,
} from "../utils/admin-athlete-response.util";
import {
  buildPlatformLinkDrafts,
  buildProfileUrl,
  normalizePlatform,
  PlatformLinkDraft,
} from "../utils/platform-link.util";
import { normalizeAthleteCountry } from "../utils/athlete-country.util";

function buildSelectedAccountsRaw(
  accounts: SelectedAthleteAccountInput[],
): Record<string, unknown> {
  return {
    source: "selected_accounts",
    captured_at: new Date().toISOString(),
    accounts: accounts.map((account) => ({
      type: account.type,
      user_id: account.user_id,
      username: account.username,
      title: account.title,
      avatar_url: account.avatar_url ?? null,
      subscribers_count: account.subscribers_count,
      is_verified: account.is_verified ?? false,
      is_private: account.is_private ?? false,
    })),
  };
}


function pickPrimaryLinkIndex(
  links: Array<{ subscribersCount?: number | null }>,
): number {
  if (links.length === 0) return -1;
  let best = 0;
  for (let i = 1; i < links.length; i += 1) {
    const current = links[i]?.subscribersCount ?? 0;
    const bestCount = links[best]?.subscribersCount ?? 0;
    if (current > bestCount) best = i;
  }
  return best;
}

@Injectable()
export class AthleteRepository {
  private mapAthleteRecord(
    athlete: {
      id: string;
      fullName: string;
      slug: string;
      avatarUrl: string | null;
      country: string | null;
      countryName?: string | null;
      languages?: string[] | null;
      emails?: string[] | null;
      description?: string | null;
      isDescriptionAdded?: boolean | null;
      isActive?: boolean | null;
      categories?: string[] | null;
      healthConditions?: string[] | null;
      personalHealthConnections?: unknown;
      tags?: string[] | null;
      gender?: string | null;
      createdAt: Date;
      updatedAt?: Date;
    },
    platformLinks: Array<{
      id: string;
      athleteId?: string;
      platform: string;
      username: string | null;
      providerSocialId?: string | null;
      profileUrl?: string | null;
      displayTitle?: string | null;
      subscribersCount: number | null;
      isVerified: boolean;
      reportState: string;
      lastSyncedAt?: Date | null;
      createdAt?: Date;
      updatedAt?: Date;
    }>,
    finalScore?: Parameters<typeof mapFinalScoreToNodeShape>[0],
    options?: { includeSyncStats?: boolean },
  ) {
    const primaryIdx = pickPrimaryLinkIndex(platformLinks);
    const mappedLinks = platformLinks.map((link, index) => {
      const socialId = link.providerSocialId ?? null;
      return {
        ...mapPlatformLinkToNodeShape(
          {
            ...link,
            avatarUrl: athlete.avatarUrl,
            providerSocialId: socialId,
          },
          athlete.id,
        ),
        isPrimary: index === primaryIdx,
        hyperauditSocialId: socialId,
      };
    });

    const mapped = {
      id: athlete.id,
      fullName: athlete.fullName,
      slug: athlete.slug,
      country: athlete.country ?? null,
      countryName: athlete.countryName ?? null,
      languages: athlete.languages ?? null,
      emails: athlete.emails ?? null,
      description: athlete.description ?? null,
      isDescriptionAdded: athlete.isDescriptionAdded ?? false,
      avatarUrl: athlete.avatarUrl,
      isActive: athlete.isActive ?? true,
      categories: athlete.categories ?? null,
      healthConditions: athlete.healthConditions ?? null,
      personalHealthConnections: athlete.personalHealthConnections ?? null,
      gender: athlete.gender ?? null,
      createdAt: athlete.createdAt,
      updatedAt: athlete.updatedAt ?? athlete.createdAt,
      platformLinks: mappedLinks,
      ...(finalScore !== undefined
        ? { finalScore: mapFinalScoreToNodeShape(finalScore) }
        : {}),
    };

    if (options?.includeSyncStats) {
      return enrichAthleteWithSync({
        ...mapped,
        syncStatus: "pending",
        tags: Array.isArray(athlete.categories) ? athlete.categories : [],
        hypeauditorCreatorId: null,
        platformLinks: mappedLinks,
      });
    }

    return mapped;
  }

  async upsertAthleteProvider(
    athleteId: string,
    provider: "hyperauditor" = "hyperauditor",
    syncStatus?: "pending" | "syncing" | "completed" | "failed",
  ) {
    await db
      .insert(athleteProviders)
      .values({
        athleteId,
        provider,
        lastSyncedAt: new Date(),
        ...(syncStatus !== undefined ? { syncStatus } : {}),
      })
      .onConflictDoUpdate({
        target: [athleteProviders.athleteId, athleteProviders.provider],
        set: {
          lastSyncedAt: new Date(),
          ...(syncStatus !== undefined ? { syncStatus } : {}),
        },
      });
  }

  private async insertPlatformLinks(
    athleteId: string,
    links: PlatformLinkDraft[],
    provider: "hyperauditor" = "hyperauditor",
  ) {
    await this.upsertAthleteProvider(athleteId, provider);

    for (const link of links) {
      await db.insert(athletePlatformLinks).values({
        athleteId,
        provider,
        platform: link.platform,
        providerSocialId: link.socialId,
        username: link.username,
        profileUrl: buildProfileUrl(link.platform, link.username),
        avatarUrl: link.avatarUrl ?? null,
        displayTitle: link.title,
        subscribersCount: link.subscribersCount,
        isVerified: link.isVerified,
        reportState: link.reportState,
      });
    }
  }

  async findMany(query: ListQuery) {
    const conditions: SQL[] = [];

    if (query.search) {
      const pattern = `%${query.search}%`;
      const platformMatches = await db
        .select({ athleteId: athletePlatformLinks.athleteId })
        .from(athletePlatformLinks)
        .where(
          or(
            ilike(athletePlatformLinks.username, pattern),
            ilike(athletePlatformLinks.displayTitle, pattern),
          ),
        );

      const platformAthleteIds = [
        ...new Set(platformMatches.map((match) => match.athleteId)),
      ];

      const searchConditions: SQL[] = [
        ilike(athletes.fullName, pattern),
        ilike(athletes.slug, pattern),
        ilike(athletes.country, pattern),
        ilike(athletes.countryName, pattern),
        ilike(athletes.description, pattern),
        sql`coalesce(${athletes.categories}::text, '') ilike ${pattern}`,
        sql`coalesce(${athletes.healthConditions}::text, '') ilike ${pattern}`,
      ];

      if (platformAthleteIds.length > 0) {
        searchConditions.push(inArray(athletes.id, platformAthleteIds));
      }

      conditions.push(or(...searchConditions)!);
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const offset = (query.page - 1) * query.limit;

    const [items, countRow] = await Promise.all([
      db
        .select({
          id: athletes.id,
          fullName: athletes.fullName,
          slug: athletes.slug,
          avatarUrl: athletes.avatarUrl,
          country: athletes.country,
          countryName: athletes.countryName,
          languages: athletes.languages,
          emails: athletes.emails,
          description: athletes.description,
          isDescriptionAdded: athletes.isDescriptionAdded,
          isActive: athletes.isActive,
          categories: athletes.categories,
          healthConditions: athletes.healthConditions,
          gender: athletes.gender,
          createdAt: athletes.createdAt,
          updatedAt: athletes.updatedAt,
        })
        .from(athletes)
        .where(where)
        .orderBy(desc(athletes.updatedAt), desc(athletes.createdAt))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(athletes)
        .where(where),
    ]);

    const athleteIds = items.map((item) => item.id);
    const [links, scores] = await Promise.all([
      athleteIds.length === 0
        ? Promise.resolve([])
        : db
            .select({
              id: athletePlatformLinks.id,
              athleteId: athletePlatformLinks.athleteId,
              platform: athletePlatformLinks.platform,
              username: athletePlatformLinks.username,
              providerSocialId: athletePlatformLinks.providerSocialId,
              profileUrl: athletePlatformLinks.profileUrl,
              displayTitle: athletePlatformLinks.displayTitle,
              subscribersCount: athletePlatformLinks.subscribersCount,
              isVerified: athletePlatformLinks.isVerified,
              reportState: athletePlatformLinks.reportState,
              lastSyncedAt: athletePlatformLinks.lastSyncedAt,
              createdAt: athletePlatformLinks.createdAt,
              updatedAt: athletePlatformLinks.updatedAt,
            })
            .from(athletePlatformLinks)
            .where(inArray(athletePlatformLinks.athleteId, athleteIds)),
      athleteIds.length === 0
        ? Promise.resolve([])
        : db
            .select()
            .from(athleteFinalScores)
            .where(inArray(athleteFinalScores.athleteId, athleteIds)),
    ]);

    const linksByAthlete = new Map<string, typeof links>();
    for (const link of links) {
      const existing = linksByAthlete.get(link.athleteId) ?? [];
      existing.push(link);
      linksByAthlete.set(link.athleteId, existing);
    }

    const scoresByAthlete = new Map(
      scores.map((score) => [score.athleteId, score]),
    );

    const enriched = items.map((item) =>
      this.mapAthleteRecord(
        item,
        linksByAthlete.get(item.id) ?? [],
        scoresByAthlete.get(item.id) ?? null,
      ),
    );

    const total = countRow[0]?.count ?? 0;
    const meta = buildPaginationMeta(query.page, query.limit, total);
    return {
      items: enriched,
      total: meta.total,
      page: meta.page,
      limit: meta.limit,
      totalPages: meta.totalPages,
    };
  }

  async searchExistingByName(name: string) {
    const pattern = `%${name.trim()}%`;
    const matches = await db
      .select({
        id: athletes.id,
        fullName: athletes.fullName,
        slug: athletes.slug,
        avatarUrl: athletes.avatarUrl,
        country: athletes.country,
        description: athletes.description,
        healthConditions: athletes.healthConditions,
        categories: athletes.categories,
        createdAt: athletes.createdAt,
        updatedAt: athletes.updatedAt,
      })
      .from(athletes)
      .where(
        or(
          ilike(athletes.fullName, pattern),
          ilike(athletes.slug, pattern),
        ),
      )
      .orderBy(asc(athletes.fullName))
      .limit(20);

    const athleteIds = matches.map((item) => item.id);
    const links =
      athleteIds.length === 0
        ? []
        : await db
            .select({
              id: athletePlatformLinks.id,
              athleteId: athletePlatformLinks.athleteId,
              platform: athletePlatformLinks.platform,
              username: athletePlatformLinks.username,
              providerSocialId: athletePlatformLinks.providerSocialId,
              profileUrl: athletePlatformLinks.profileUrl,
              displayTitle: athletePlatformLinks.displayTitle,
              subscribersCount: athletePlatformLinks.subscribersCount,
              isVerified: athletePlatformLinks.isVerified,
              reportState: athletePlatformLinks.reportState,
            })
            .from(athletePlatformLinks)
            .where(inArray(athletePlatformLinks.athleteId, athleteIds));

    const linksByAthlete = new Map<string, typeof links>();
    for (const link of links) {
      const existing = linksByAthlete.get(link.athleteId) ?? [];
      existing.push(link);
      linksByAthlete.set(link.athleteId, existing);
    }

    return matches.map((item) =>
      this.mapAthleteRecord(item, linksByAthlete.get(item.id) ?? []),
    );
  }

  async findById(id: string) {
    const [athlete] = await db
      .select()
      .from(athletes)
      .where(eq(athletes.id, id))
      .limit(1);
    if (!athlete) return null;

    const links = await db
      .select({
        id: athletePlatformLinks.id,
        athleteId: athletePlatformLinks.athleteId,
        platform: athletePlatformLinks.platform,
        username: athletePlatformLinks.username,
        providerSocialId: athletePlatformLinks.providerSocialId,
        profileUrl: athletePlatformLinks.profileUrl,
        displayTitle: athletePlatformLinks.displayTitle,
        subscribersCount: athletePlatformLinks.subscribersCount,
        isVerified: athletePlatformLinks.isVerified,
        reportState: athletePlatformLinks.reportState,
        lastSyncedAt: athletePlatformLinks.lastSyncedAt,
        createdAt: athletePlatformLinks.createdAt,
        updatedAt: athletePlatformLinks.updatedAt,
      })
      .from(athletePlatformLinks)
      .where(eq(athletePlatformLinks.athleteId, id));

    const [finalScore] = await db
      .select()
      .from(athleteFinalScores)
      .where(eq(athleteFinalScores.athleteId, id))
      .limit(1);

    return this.mapAthleteRecord(athlete, links, finalScore ?? null);
  }

  async deletePlatformLink(athleteId: string, linkId: string) {
    const [link] = await db
      .select({
        id: athletePlatformLinks.id,
        athleteId: athletePlatformLinks.athleteId,
      })
      .from(athletePlatformLinks)
      .where(
        and(
          eq(athletePlatformLinks.id, linkId),
          eq(athletePlatformLinks.athleteId, athleteId),
        ),
      )
      .limit(1);

    if (!link) {
      return null;
    }

    await db.transaction(async (tx) => {
      // Live has no tiktok_raw_data / tiktok_scores — only IG/YT/Twitter tables exist.
      await tx
        .delete(instagramRawData)
        .where(eq(instagramRawData.linkId, linkId));
      await tx
        .delete(instagramScores)
        .where(eq(instagramScores.linkId, linkId));
      await tx.delete(youtubeRawData).where(eq(youtubeRawData.linkId, linkId));
      await tx.delete(youtubeScores).where(eq(youtubeScores.linkId, linkId));
      await tx.delete(twitterRawData).where(eq(twitterRawData.linkId, linkId));
      await tx.delete(twitterScores).where(eq(twitterScores.linkId, linkId));
      await tx
        .delete(athletePlatformLinks)
        .where(eq(athletePlatformLinks.id, linkId));
    });

    return this.findById(athleteId);
  }

  async findByHypeAuditorSocialId(
    platform: HypeAuditorPlatform,
    socialId: string,
  ) {
    const [link] = await db
      .select({ athleteId: athletePlatformLinks.athleteId })
      .from(athletePlatformLinks)
      .where(
        and(
          eq(athletePlatformLinks.platform, platform),
          eq(athletePlatformLinks.providerSocialId, socialId),
        ),
      )
      .limit(1);
    return link ?? null;
  }

  /** Live DB has no athletes.hypeauditor_creator_id — always null. */
  async findByHypeAuditorCreatorId(
    _creatorId: string,
  ): Promise<{ id: string } | null> {
    return null;
  }

  private validateSelectedAccounts(accounts: SelectedAthleteAccountInput[]) {
    for (const account of accounts) {
      const platform = normalizePlatform(account.type);
      if (!platform) {
        throw new AppError(
          400,
          `Unsupported platform: ${account.type}`,
          "UNSUPPORTED_PLATFORM",
        );
      }
    }
  }

  private normalizeAthleteName(value: string) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
  }

  private async backfillCreatorProfile(
    athleteId: string,
    creatorProfile: HypeAuditorCreator | null | undefined,
    _selectedAccounts?: SelectedAthleteAccountInput[],
  ) {
    if (!creatorProfile) {
      return;
    }

    const [existing] = await db
      .select({
        country: athletes.country,
        countryName: athletes.countryName,
        description: athletes.description,
      })
      .from(athletes)
      .where(eq(athletes.id, athleteId))
      .limit(1);

    if (!existing) {
      return;
    }

    const updates: Partial<typeof athletes.$inferInsert> = {
      updatedAt: new Date(),
    };

    const creatorCountry =
      creatorProfile.country?.code?.trim() ||
      creatorProfile.country?.title?.trim() ||
      null;
    const creatorBio = creatorProfile.bio?.trim() || null;
    const normalizedCountry = normalizeAthleteCountry({
      code: creatorProfile.country?.code,
      title: creatorProfile.country?.title,
      country: creatorCountry,
    });

    if (!existing.country && normalizedCountry.country) {
      updates.country = normalizedCountry.country;
    }
    if (!existing.countryName && normalizedCountry.countryName) {
      updates.countryName = normalizedCountry.countryName;
    }
    if (!existing.description && creatorBio) {
      updates.description = creatorBio;
    }

    if (Object.keys(updates).length <= 1) {
      return;
    }

    await db.update(athletes).set(updates).where(eq(athletes.id, athleteId));
  }

  private async findNameMatchedAthletes(fullName: string) {
    const normalizedName = this.normalizeAthleteName(fullName);
    if (!normalizedName) {
      return [];
    }

    return db
      .select({
        id: athletes.id,
        fullName: athletes.fullName,
        avatarUrl: athletes.avatarUrl,
      })
      .from(athletes)
      .where(
        sql`lower(regexp_replace(trim(${athletes.fullName}), '\s+', ' ', 'g')) = ${normalizedName}`,
      )
      .limit(2);
  }

  private async resolveExistingAthleteForAccounts(
    accounts: SelectedAthleteAccountInput[],
  ) {
    const athleteIds = new Set<string>();

    for (const account of accounts) {
      const platform = normalizePlatform(account.type);
      if (!platform) continue;

      const existing = await this.findByHypeAuditorSocialId(
        platform,
        account.user_id,
      );
      if (existing) {
        athleteIds.add(existing.athleteId);
      }
    }

    if (athleteIds.size > 1) {
      throw new AppError(
        409,
        "Selected accounts belong to different athletes. Add them separately.",
        "ATHLETE_SELECTION_CONFLICT",
      );
    }

    return athleteIds.size === 1 ? [...athleteIds][0] : null;
  }

  async addPlatformsToAthlete(
    athleteId: string,
    input: AddPlatformsInput,
    creatorProfile?: HypeAuditorCreator | null,
  ) {
    this.validateSelectedAccounts(input.accounts);

    const athlete = await this.findById(athleteId);
    if (!athlete) {
      throw new AppError(404, "Athlete not found", "NOT_FOUND");
    }

    await this.backfillCreatorProfile(
      athleteId,
      creatorProfile,
      input.accounts,
    );

    for (const account of input.accounts) {
      const platform = normalizePlatform(account.type)!;
      const existing = await this.findByHypeAuditorSocialId(
        platform,
        account.user_id,
      );

      if (existing && existing.athleteId !== athleteId) {
        const existingAthlete = await this.findById(existing.athleteId);
        if (!existingAthlete) {
          throw new AppError(404, "Athlete not found", "NOT_FOUND");
        }

        return {
          athlete: existingAthlete,
          alreadyExists: true,
          redirected: true,
        };
      }
    }

    const existingKeys = new Set(
      athlete.platformLinks.map(
        (link) => `${link.platform}:${link.providerSocialId}`,
      ),
    );

    const accountsToAdd = input.accounts.filter((account) => {
      const platform = normalizePlatform(account.type);
      if (!platform) return false;
      return !existingKeys.has(`${platform}:${account.user_id}`);
    });

    if (accountsToAdd.length === 0) {
      return {
        athlete,
        alreadyExists: true,
        redirected: false,
      };
    }

    const primaryLink = athlete.platformLinks[0];
    const linkDrafts = buildPlatformLinkDrafts(accountsToAdd, creatorProfile, {
      primaryPlatform: primaryLink?.platform as HypeAuditorPlatform | undefined,
      primarySocialId: primaryLink?.providerSocialId ?? undefined,
    });

    if (linkDrafts.length === 0) {
      throw new AppError(
        400,
        "No valid platform accounts were selected",
        "INVALID_SELECTION",
      );
    }

    await this.insertPlatformLinks(athleteId, linkDrafts);

    const updatedAthlete = await this.findById(athleteId);
    if (!updatedAthlete) {
      throw new AppError(404, "Athlete not found", "NOT_FOUND");
    }

    return {
      athlete: updatedAthlete,
      alreadyExists: false,
      redirected: false,
    };
  }

  async createManual(input: CreateManualAthleteInput) {
    const fullName = `${input.first_name} ${input.last_name}`.trim();
    const slug = await makeUniqueSlug(
      `${input.first_name}-${input.last_name}`,
      athletes,
      athletes.slug,
    );

    const countryFields = normalizeAthleteCountry({
      country: input.country,
      countryName: input.country,
    });

    const [athlete] = await db
      .insert(athletes)
      .values({
        fullName,
        slug,
        avatarUrl: input.avatar_url ?? null,
        country: countryFields.country,
        countryName: countryFields.countryName,
        description: input.description?.trim() || null,
        healthConditions: input.health_conditions,
        categories: input.tags ?? [],
      })
      .returning();

    const createdAthlete = await this.findById(athlete.id);
    if (!createdAthlete) {
      throw new AppError(404, "Athlete not found", "NOT_FOUND");
    }

    return {
      athlete: createdAthlete,
      alreadyExists: false,
      redirected: false,
    };
  }

  async createFromSelectedAccounts(
    input: AddPlatformsInput,
    creatorProfile?: HypeAuditorCreator | null,
  ) {
    this.validateSelectedAccounts(input.accounts);

    const existingAthleteId = await this.resolveExistingAthleteForAccounts(
      input.accounts,
    );

    if (existingAthleteId) {
      return this.addPlatformsToAthlete(
        existingAthleteId,
        input,
        creatorProfile,
      );
    }

    const creatorId = creatorProfile ? String(creatorProfile.id) : null;
    if (creatorId) {
      const existingCreator = await this.findByHypeAuditorCreatorId(creatorId);
      if (existingCreator) {
        return this.addPlatformsToAthlete(
          existingCreator.id,
          input,
          creatorProfile,
        );
      }
    }

    const primarySelected = input.accounts.reduce((best, current) =>
      current.subscribers_count > best.subscribers_count ? current : best,
    );
    const primaryPlatform = normalizePlatform(primarySelected.type)!;

    const creatorName = creatorProfile
      ? [creatorProfile.first_name, creatorProfile.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || primarySelected.title.trim()
      : primarySelected.title.trim();

    const creatorAvatar =
      creatorProfile?.avatar_url || primarySelected.avatar_url || null;

    const creatorCountry = normalizeAthleteCountry({
      code: creatorProfile?.country?.code,
      title: creatorProfile?.country?.title,
    });

    if (input.existing_athlete_id) {
      return this.addPlatformsToAthlete(
        input.existing_athlete_id,
        input,
        creatorProfile,
      );
    }

    const sameNameMatches = await this.findNameMatchedAthletes(creatorName);
    if (sameNameMatches.length === 1) {
      const candidateAthlete = await this.findById(sameNameMatches[0]!.id);
      if (candidateAthlete) {
        return {
          requiresConfirmation: true,
          similarAthletes: sameNameMatches.map((match) => ({
            id: match.id,
            fullName: match.fullName,
            avatarUrl: match.avatarUrl,
          })),
          athlete: null,
        };
      }
    }

    const slug = await makeUniqueSlug(
      primarySelected.username || creatorName,
      athletes,
      athletes.slug,
    );

    const [athlete] = await db
      .insert(athletes)
      .values({
        fullName: creatorName,
        slug,
        avatarUrl: creatorAvatar,
        country: creatorCountry.country,
        countryName: creatorCountry.countryName,
        description: creatorProfile?.bio?.trim() || null,
      })
      .returning();

    const linkDrafts = buildPlatformLinkDrafts(input.accounts, creatorProfile, {
      primaryPlatform,
      primarySocialId: primarySelected.user_id,
    });

    if (linkDrafts.length === 0) {
      throw new AppError(
        400,
        "No valid platform accounts were selected",
        "INVALID_SELECTION",
      );
    }

    await this.insertPlatformLinks(athlete.id, linkDrafts);

    const createdAthlete = await this.findById(athlete.id);
    if (!createdAthlete) {
      throw new AppError(404, "Athlete not found", "NOT_FOUND");
    }

    return {
      requiresConfirmation: false,
      similarAthletes: [],
      athlete: createdAthlete,
    };
  }

  async backfillMissingCreatorRaw(
    _resolveCreators: (
      accounts: Array<{ social_type: string; social_id: string }>,
    ) => Promise<HypeAuditorCreator[]>,
  ): Promise<{
    total: number;
    updated: number;
    withCreatorProfile: number;
    withFallback: number;
  }> {
    // Live DB has no hypeauditor_creator_raw / hypeauditor_creator_id columns.
    return {
      total: 0,
      updated: 0,
      withCreatorProfile: 0,
      withFallback: 0,
    };
  }

  async updateManual(id: string, input: UpdateManualAthleteInput) {
    const [existing] = await db
      .select()
      .from(athletes)
      .where(eq(athletes.id, id))
      .limit(1);

    if (!existing) {
      return null;
    }

    const nameParts = existing.fullName.trim().split(/\s+/);
    const currentFirstName = nameParts[0] ?? "";
    const currentLastName = nameParts.slice(1).join(" ");
    const firstName = input.first_name ?? currentFirstName;
    const lastName = input.last_name ?? currentLastName;

    const updates: Partial<typeof athletes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.first_name !== undefined || input.last_name !== undefined) {
      updates.fullName = `${firstName} ${lastName}`.trim();
      updates.slug = await makeUniqueSlug(
        `${firstName}-${lastName}`,
        athletes,
        athletes.slug,
        id,
      );
    }

    if (input.country !== undefined) {
      const countryFields = normalizeAthleteCountry({
        country: input.country,
        countryName: input.country,
      });
      updates.country = countryFields.country;
      if (countryFields.countryName) {
        updates.countryName = countryFields.countryName;
      }
    }

    if (input.description !== undefined) {
      updates.description = input.description.trim() || null;
    }

    if (input.health_conditions !== undefined) {
      updates.healthConditions = input.health_conditions;
    }

    if (input.tags !== undefined) {
      updates.categories = input.tags;
    }

    if (input.avatar_url !== undefined) {
      updates.avatarUrl = input.avatar_url;
    }

    await db.update(athletes).set(updates).where(eq(athletes.id, id));

    return this.findById(id);
  }

  async deleteById(id: string) {
    const athlete = await this.findById(id);
    if (!athlete) {
      return null;
    }

    await db.transaction(async (tx) => {
      const links = await tx
        .select({ id: athletePlatformLinks.id })
        .from(athletePlatformLinks)
        .where(eq(athletePlatformLinks.athleteId, id));

      const linkIds = links.map((link) => link.id);

      if (linkIds.length > 0) {
        await tx
          .delete(instagramRawData)
          .where(inArray(instagramRawData.linkId, linkIds));
        await tx
          .delete(instagramScores)
          .where(inArray(instagramScores.linkId, linkIds));
        await tx
          .delete(youtubeRawData)
          .where(inArray(youtubeRawData.linkId, linkIds));
        await tx
          .delete(youtubeScores)
          .where(inArray(youtubeScores.linkId, linkIds));
        await tx
          .delete(twitterRawData)
          .where(inArray(twitterRawData.linkId, linkIds));
        await tx
          .delete(twitterScores)
          .where(inArray(twitterScores.linkId, linkIds));
        // Live has no tiktok_raw_data / tiktok_scores.
        await tx
          .delete(athletePlatformLinks)
          .where(eq(athletePlatformLinks.athleteId, id));
      }

      await tx
        .delete(athleteFinalScores)
        .where(eq(athleteFinalScores.athleteId, id));
      await tx.delete(athletes).where(eq(athletes.id, id));
    });

    return athlete;
  }

  async updateAiProfile(
    athleteId: string,
    data: {
      description?: string | null;
      summary?: string | null;
      tags?: string[];
      campaignCategories?: string[];
      healthConditions?: string[];
      personalHealthConnections?: unknown;
      country?: string | null;
      countryName?: string | null;
      gender?: string | null;
      languages?: string[];
      categories?: string[];
      isDescriptionAdded?: boolean;
      isActive?: boolean;
    },
  ) {
    const patch: Record<string, unknown> = {
      updatedAt: new Date(),
      isActive: data.isActive ?? true,
    };

    if (data.description !== undefined && data.description !== null) {
      patch.description = data.description;
      patch.isDescriptionAdded = true;
    } else if (data.isDescriptionAdded !== undefined) {
      patch.isDescriptionAdded = data.isDescriptionAdded;
    }

    if (data.categories !== undefined) {
      patch.categories = data.categories;
    } else if (data.tags !== undefined) {
      patch.categories = data.tags;
    } else if (data.campaignCategories !== undefined) {
      patch.categories = data.campaignCategories;
    }

    if (data.healthConditions !== undefined) {
      patch.healthConditions = data.healthConditions;
    }

    if (data.personalHealthConnections !== undefined) {
      patch.personalHealthConnections = data.personalHealthConnections;
    }

    if (data.country !== undefined || data.countryName !== undefined) {
      const countryFields = normalizeAthleteCountry({
        country: data.country,
        countryName: data.countryName,
      });
      if (data.country !== undefined) {
        patch.country = countryFields.country;
      }
      if (data.countryName !== undefined || countryFields.countryName) {
        patch.countryName =
          data.countryName !== undefined
            ? countryFields.countryName
            : countryFields.countryName;
      }
    }

    if (data.gender !== undefined) {
      patch.gender = data.gender;
    }

    if (data.languages !== undefined) {
      patch.languages = data.languages;
    }

    const [athlete] = await db
      .update(athletes)
      .set(patch)
      .where(eq(athletes.id, athleteId))
      .returning();

    return athlete;
  }

  async upsertAthleteFinalScore(
    athleteId: string,
    data: {
      resonanceScore?: number | null;
      credibilityScore?: number | null;
      audienceTrustScore?: number | null;
      brandOverSafetyScore?: number | null;
      conditionAlignmentScore?: number | null;
      healthleteMatchScore?: number | null;
      avgEngagementRate?: number | null;
      avgLikes?: number | null;
      avgComments?: number | null;
      engagementQualityScore?: number | null;
      weightDistribution?: unknown;
      scoreBreakdown?: unknown;
    },
  ) {
    const values = {
      athleteId,
      resonanceScore:
        data.resonanceScore === null || data.resonanceScore === undefined
          ? null
          : String(data.resonanceScore),
      credibilityScore:
        data.credibilityScore === null || data.credibilityScore === undefined
          ? null
          : String(data.credibilityScore),
      audienceTrustScore:
        data.audienceTrustScore === null ||
        data.audienceTrustScore === undefined
          ? null
          : String(data.audienceTrustScore),
      brandOverSafetyScore:
        data.brandOverSafetyScore === null ||
        data.brandOverSafetyScore === undefined
          ? null
          : String(data.brandOverSafetyScore),
      conditionAlignmentScore:
        data.conditionAlignmentScore === null ||
        data.conditionAlignmentScore === undefined
          ? null
          : String(data.conditionAlignmentScore),
      healthleteMatchScore:
        data.healthleteMatchScore === null ||
        data.healthleteMatchScore === undefined
          ? null
          : String(data.healthleteMatchScore),
      avgEngagementRate:
        data.avgEngagementRate === null || data.avgEngagementRate === undefined
          ? null
          : String(data.avgEngagementRate),
      avgLikes:
        data.avgLikes === null || data.avgLikes === undefined
          ? null
          : data.avgLikes,
      avgComments:
        data.avgComments === null || data.avgComments === undefined
          ? null
          : data.avgComments,
      engagementQualityScore:
        data.engagementQualityScore === null ||
        data.engagementQualityScore === undefined
          ? null
          : String(data.engagementQualityScore),
      weightDistribution: data.weightDistribution ?? null,
      scoreBreakdown: data.scoreBreakdown ?? null,
      calculatedAt: new Date(),
      updatedAt: new Date(),
    };

    const [existing] = await db
      .select({ id: athleteFinalScores.id })
      .from(athleteFinalScores)
      .where(eq(athleteFinalScores.athleteId, athleteId))
      .limit(1);

    if (existing) {
      await db
        .update(athleteFinalScores)
        .set(values)
        .where(eq(athleteFinalScores.athleteId, athleteId));
      return;
    }

    await db.insert(athleteFinalScores).values(values);
  }

  async getResonanceSummary(athleteId: string) {
    const scores = await db
      .select({
        score: athleteResonanceScores.score,
        conditionName: resonanceConditions.name,
      })
      .from(athleteResonanceScores)
      .leftJoin(
        resonanceConditions,
        eq(
          athleteResonanceScores.resonanceConditionId,
          resonanceConditions.id,
        ),
      )
      .where(eq(athleteResonanceScores.athleteId, athleteId));

    if (!scores.length) {
      return { averageScore: 0, maxScore: 0, maxCondition: null, breakdown: [] };
    }

    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

    return {
      averageScore: Math.round(totalScore / scores.length),
      maxScore: sorted[0].score,
      maxCondition: sorted[0].conditionName ?? null,
      breakdown: sorted.map((s) => ({
        condition: s.conditionName,
        score: s.score,
      })),
    };
  }
}
