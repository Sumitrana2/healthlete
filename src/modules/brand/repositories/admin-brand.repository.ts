import { Injectable } from "@nestjs/common";
import { and, asc, eq, ilike, or, sql, SQL } from "drizzle-orm";
import { db } from "../../../database/drizzle";
import {
  athleteLanguages,
  brandCampaignObjectives,
  brandHealthConditions,
  brandPreferredChannels,
  brandRequiredLanguages,
  brands,
  campaignObjectives,
  companies,
  companySizes,
  healthConditions,
  industries,
  preferredChannels,
} from "../../../database/drizzle/schema";
import { buildPaginationMeta } from "../../../common/dto/pagination.dto";
import { toClientPaginatedData } from "../../../common/utils/paginated-list-response.util";
import type { AdminBrandsListQuery } from "../dto/admin-brand.dto";

@Injectable()
export class AdminBrandRepository {
  async findMany(query: AdminBrandsListQuery) {
    const conditions: SQL[] = [];

    if (query.search) {
      const pattern = `%${query.search}%`;
      conditions.push(
        or(
          ilike(brands.email, pattern),
          ilike(brands.firstName, pattern),
          ilike(brands.lastName, pattern),
          ilike(brands.slug, pattern),
          ilike(companies.name, pattern),
        )!,
      );
    }

    if (query.isActive !== undefined) {
      conditions.push(eq(brands.isActive, query.isActive));
    }

    if (query.approvalStatus) {
      conditions.push(eq(brands.approvalStatus, query.approvalStatus));
    }

    if (query.companyId) {
      conditions.push(eq(brands.companyId, query.companyId));
    }

    if (query.industryId) {
      conditions.push(eq(companies.industryId, query.industryId));
    }

    const where = conditions.length ? and(...conditions) : undefined;
    const offset = (query.page - 1) * query.limit;

    const [items, countRow] = await Promise.all([
      db
        .select({
          id: brands.id,
          slug: brands.slug,
          email: brands.email,
          firstName: brands.firstName,
          lastName: brands.lastName,
          role: brands.role,
          companyId: brands.companyId,
          onboardingStep: brands.onboardingStep,
          isOnboardingComplete: brands.isOnboardingComplete,
          isEmailVerified: brands.isEmailVerified,
          approvalStatus: brands.approvalStatus,
          reviewedBy: brands.reviewedBy,
          reviewedAt: brands.reviewedAt,
          failedLoginAttempts: brands.failedLoginAttempts,
          lockedUntil: brands.lockedUntil,
          isActive: brands.isActive,
          lastLoginAt: brands.lastLoginAt,
          createdAt: brands.createdAt,
          updatedAt: brands.updatedAt,
          company: {
            id: companies.id,
            name: companies.name,
            website: companies.website,
            logoUrl: companies.logoUrl,
            description: companies.description,
            country: companies.country,
            industryId: companies.industryId,
            companySizeId: companies.companySizeId,
            createdAt: companies.createdAt,
            updatedAt: companies.updatedAt,
          },
          industry: {
            id: industries.id,
            name: industries.name,
            slug: industries.slug,
            isActive: industries.isActive,
          },
          companySize: {
            id: companySizes.id,
            label: companySizes.label,
            sortOrder: companySizes.sortOrder,
            isActive: companySizes.isActive,
          },
        })
        .from(brands)
        .leftJoin(companies, eq(brands.companyId, companies.id))
        .leftJoin(industries, eq(companies.industryId, industries.id))
        .leftJoin(companySizes, eq(companies.companySizeId, companySizes.id))
        .where(where)
        .orderBy(asc(brands.createdAt))
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(brands)
        .leftJoin(companies, eq(brands.companyId, companies.id))
        .where(where),
    ]);

    const mapped = items.map((row) => ({
      id: row.id,
      slug: row.slug,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      companyId: row.companyId,
      onboardingStep: row.onboardingStep,
      isOnboardingComplete: row.isOnboardingComplete,
      isEmailVerified: row.isEmailVerified,
      approvalStatus: row.approvalStatus,
      reviewedBy: row.reviewedBy,
      reviewedAt: row.reviewedAt,
      failedLoginAttempts: row.failedLoginAttempts,
      lockedUntil: row.lockedUntil,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      company: row.company?.id
        ? {
            ...row.company,
            industry: row.industry?.id ? row.industry : null,
            companySize: row.companySize?.id ? row.companySize : null,
          }
        : null,
    }));

    const total = countRow[0]?.count ?? 0;
    return toClientPaginatedData(
      mapped,
      buildPaginationMeta(query.page, query.limit, total),
    );
  }

  async findById(id: string) {
    const [row] = await db
      .select({
        id: brands.id,
        slug: brands.slug,
        email: brands.email,
        firstName: brands.firstName,
        lastName: brands.lastName,
        role: brands.role,
        companyId: brands.companyId,
        onboardingStep: brands.onboardingStep,
        isOnboardingComplete: brands.isOnboardingComplete,
        isEmailVerified: brands.isEmailVerified,
        approvalStatus: brands.approvalStatus,
        reviewedBy: brands.reviewedBy,
        reviewedAt: brands.reviewedAt,
        failedLoginAttempts: brands.failedLoginAttempts,
        lockedUntil: brands.lockedUntil,
        isActive: brands.isActive,
        lastLoginAt: brands.lastLoginAt,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
        company: {
          id: companies.id,
          name: companies.name,
          website: companies.website,
          logoUrl: companies.logoUrl,
          description: companies.description,
          country: companies.country,
          industryId: companies.industryId,
          companySizeId: companies.companySizeId,
          createdAt: companies.createdAt,
          updatedAt: companies.updatedAt,
        },
        industry: {
          id: industries.id,
          name: industries.name,
          slug: industries.slug,
          isActive: industries.isActive,
        },
        companySize: {
          id: companySizes.id,
          label: companySizes.label,
          sortOrder: companySizes.sortOrder,
          isActive: companySizes.isActive,
        },
      })
      .from(brands)
      .leftJoin(companies, eq(brands.companyId, companies.id))
      .leftJoin(industries, eq(companies.industryId, industries.id))
      .leftJoin(companySizes, eq(companies.companySizeId, companySizes.id))
      .where(eq(brands.id, id))
      .limit(1);

    if (!row) return null;

    const [
      healthConditionRows,
      campaignObjectiveRows,
      preferredChannelRows,
      requiredLanguageRows,
    ] = await Promise.all([
      db
        .select({
          id: healthConditions.id,
          name: healthConditions.name,
          isActive: healthConditions.isActive,
          createdAt: healthConditions.createdAt,
          updatedAt: healthConditions.updatedAt,
        })
        .from(brandHealthConditions)
        .innerJoin(
          healthConditions,
          eq(brandHealthConditions.healthConditionId, healthConditions.id),
        )
        .where(eq(brandHealthConditions.brandId, id)),
      db
        .select({
          id: campaignObjectives.id,
          name: campaignObjectives.name,
          isActive: campaignObjectives.isActive,
          createdAt: campaignObjectives.createdAt,
          updatedAt: campaignObjectives.updatedAt,
        })
        .from(brandCampaignObjectives)
        .innerJoin(
          campaignObjectives,
          eq(
            brandCampaignObjectives.campaignObjectiveId,
            campaignObjectives.id,
          ),
        )
        .where(eq(brandCampaignObjectives.brandId, id)),
      db
        .select({
          id: preferredChannels.id,
          name: preferredChannels.name,
          isActive: preferredChannels.isActive,
          createdAt: preferredChannels.createdAt,
          updatedAt: preferredChannels.updatedAt,
        })
        .from(brandPreferredChannels)
        .innerJoin(
          preferredChannels,
          eq(brandPreferredChannels.channelId, preferredChannels.id),
        )
        .where(eq(brandPreferredChannels.brandId, id)),
      db
        .select({
          id: athleteLanguages.id,
          name: athleteLanguages.name,
          code: athleteLanguages.code,
          isActive: athleteLanguages.isActive,
          createdAt: athleteLanguages.createdAt,
          updatedAt: athleteLanguages.updatedAt,
        })
        .from(brandRequiredLanguages)
        .innerJoin(
          athleteLanguages,
          eq(brandRequiredLanguages.languageId, athleteLanguages.id),
        )
        .where(eq(brandRequiredLanguages.brandId, id)),
    ]);

    return {
      id: row.id,
      slug: row.slug,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      role: row.role,
      companyId: row.companyId,
      onboardingStep: row.onboardingStep,
      isOnboardingComplete: row.isOnboardingComplete,
      isEmailVerified: row.isEmailVerified,
      approvalStatus: row.approvalStatus,
      reviewedBy: row.reviewedBy,
      reviewedAt: row.reviewedAt,
      failedLoginAttempts: row.failedLoginAttempts,
      lockedUntil: row.lockedUntil,
      isActive: row.isActive,
      lastLoginAt: row.lastLoginAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      company: row.company?.id
        ? {
            ...row.company,
            industry: row.industry?.id ? row.industry : null,
            companySize: row.companySize?.id ? row.companySize : null,
          }
        : null,
      healthConditions: healthConditionRows.map((healthCondition) => ({
        healthCondition,
      })),
      campaignObjectives: campaignObjectiveRows.map((campaignObjective) => ({
        campaignObjective,
      })),
      preferredChannels: preferredChannelRows.map((channel) => ({ channel })),
      requiredLanguages: requiredLanguageRows.map((language) => ({ language })),
    };
  }

  async updateStatus(id: string, isActive: boolean) {
    const [updated] = await db
      .update(brands)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(brands.id, id))
      .returning({
        id: brands.id,
        slug: brands.slug,
        email: brands.email,
        firstName: brands.firstName,
        lastName: brands.lastName,
        role: brands.role,
        companyId: brands.companyId,
        onboardingStep: brands.onboardingStep,
        isOnboardingComplete: brands.isOnboardingComplete,
        isEmailVerified: brands.isEmailVerified,
        approvalStatus: brands.approvalStatus,
        reviewedBy: brands.reviewedBy,
        reviewedAt: brands.reviewedAt,
        failedLoginAttempts: brands.failedLoginAttempts,
        lockedUntil: brands.lockedUntil,
        isActive: brands.isActive,
        lastLoginAt: brands.lastLoginAt,
        createdAt: brands.createdAt,
        updatedAt: brands.updatedAt,
      });

    return updated ?? null;
  }

  async deleteById(id: string) {
    await db.delete(brands).where(eq(brands.id, id));
  }
}
