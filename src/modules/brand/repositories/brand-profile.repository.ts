import { Injectable } from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";
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
  healthConditions,
  industries,
  preferredChannels,
} from "../../../database/drizzle/schema";
import { AppError } from "../../../common/exceptions/app.error";

@Injectable()
export class BrandProfileRepository {
  async findBrandById(id: string) {
    const [brand] = await db.select().from(brands).where(eq(brands.id, id));
    return brand ?? null;
  }

  async findIndustryById(id: string) {
    const [industry] = await db
      .select({ id: industries.id, name: industries.name })
      .from(industries)
      .where(and(eq(industries.id, id), eq(industries.isActive, true)))
      .limit(1);
    return industry ?? null;
  }

  async findCompanyById(id: string) {
    const [company] = await db
      .select({
        id: companies.id,
        name: companies.name,
        website: companies.website,
        industryId: companies.industryId,
        industry: {
          id: industries.id,
          name: industries.name,
        },
      })
      .from(companies)
      .leftJoin(industries, eq(companies.industryId, industries.id))
      .where(eq(companies.id, id))
      .limit(1);
    return company ?? null;
  }

  async createCompany(input: {
    name: string;
    website: string;
    industryId: string;
  }) {
    const [company] = await db
      .insert(companies)
      .values({
        name: input.name.trim(),
        website: input.website.trim(),
        industryId: input.industryId,
      })
      .returning({ id: companies.id });
    return company;
  }

  async updateCompany(
    id: string,
    input: { name: string; website: string; industryId: string },
  ) {
    await db
      .update(companies)
      .set({
        name: input.name.trim(),
        website: input.website.trim(),
        industryId: input.industryId,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id));
  }

  async linkBrandToCompany(
    brandId: string,
    companyId: string,
    role: string,
    onboardingStep: number,
  ) {
    const [brand] = await db
      .update(brands)
      .set({
        companyId,
        role: role.trim(),
        onboardingStep,
        updatedAt: new Date(),
      })
      .where(eq(brands.id, brandId))
      .returning();
    return brand;
  }

  async updateBrandOnboarding(
    brandId: string,
    values: {
      onboardingStep?: number;
      isOnboardingComplete?: boolean;
    },
  ) {
    const [brand] = await db
      .update(brands)
      .set({
        ...values,
        updatedAt: new Date(),
      })
      .where(eq(brands.id, brandId))
      .returning();
    return brand;
  }

  async countActiveHealthConditions(ids: string[]) {
    if (!ids.length) return 0;
    const rows = await db
      .select({ id: healthConditions.id })
      .from(healthConditions)
      .where(
        and(
          inArray(healthConditions.id, ids),
          eq(healthConditions.isActive, true),
        ),
      );
    return rows.length;
  }

  async countActiveCampaignObjectives(ids: string[]) {
    if (!ids.length) return 0;
    const rows = await db
      .select({ id: campaignObjectives.id })
      .from(campaignObjectives)
      .where(
        and(
          inArray(campaignObjectives.id, ids),
          eq(campaignObjectives.isActive, true),
        ),
      );
    return rows.length;
  }

  async countActivePreferredChannels(ids: string[]) {
    if (!ids.length) return 0;
    const rows = await db
      .select({ id: preferredChannels.id })
      .from(preferredChannels)
      .where(
        and(
          inArray(preferredChannels.id, ids),
          eq(preferredChannels.isActive, true),
        ),
      );
    return rows.length;
  }

  async countActiveLanguages(ids: string[]) {
    if (!ids.length) return 0;
    const rows = await db
      .select({ id: athleteLanguages.id })
      .from(athleteLanguages)
      .where(
        and(
          inArray(athleteLanguages.id, ids),
          eq(athleteLanguages.isActive, true),
        ),
      );
    return rows.length;
  }

  async replaceHealthConditions(brandId: string, ids: string[]) {
    await db.transaction(async (tx) => {
      await tx
        .delete(brandHealthConditions)
        .where(eq(brandHealthConditions.brandId, brandId));

      if (ids.length) {
        await tx.insert(brandHealthConditions).values(
          ids.map((healthConditionId) => ({
            brandId,
            healthConditionId,
          })),
        );
      }
    });
  }

  async replaceCampaignObjectives(brandId: string, ids: string[]) {
    await db.transaction(async (tx) => {
      await tx
        .delete(brandCampaignObjectives)
        .where(eq(brandCampaignObjectives.brandId, brandId));

      if (ids.length) {
        await tx.insert(brandCampaignObjectives).values(
          ids.map((campaignObjectiveId) => ({
            brandId,
            campaignObjectiveId,
          })),
        );
      }
    });
  }

  async replacePreferredChannels(brandId: string, ids: string[]) {
    await db.transaction(async (tx) => {
      await tx
        .delete(brandPreferredChannels)
        .where(eq(brandPreferredChannels.brandId, brandId));

      if (ids.length) {
        await tx.insert(brandPreferredChannels).values(
          ids.map((channelId) => ({
            brandId,
            channelId,
          })),
        );
      }
    });
  }

  async replaceRequiredLanguages(brandId: string, ids: string[]) {
    await db.transaction(async (tx) => {
      await tx
        .delete(brandRequiredLanguages)
        .where(eq(brandRequiredLanguages.brandId, brandId));

      if (ids.length) {
        await tx.insert(brandRequiredLanguages).values(
          ids.map((languageId) => ({
            brandId,
            languageId,
          })),
        );
      }
    });
  }

  async getBrandHealthConditions(brandId: string) {
    return db
      .select({
        id: healthConditions.id,
        name: healthConditions.name,
      })
      .from(brandHealthConditions)
      .innerJoin(
        healthConditions,
        eq(brandHealthConditions.healthConditionId, healthConditions.id),
      )
      .where(eq(brandHealthConditions.brandId, brandId));
  }

  async getBrandCampaignObjectives(brandId: string) {
    return db
      .select({
        id: campaignObjectives.id,
        name: campaignObjectives.name,
      })
      .from(brandCampaignObjectives)
      .innerJoin(
        campaignObjectives,
        eq(brandCampaignObjectives.campaignObjectiveId, campaignObjectives.id),
      )
      .where(eq(brandCampaignObjectives.brandId, brandId));
  }

  async getBrandPreferredChannels(brandId: string) {
    return db
      .select({
        id: preferredChannels.id,
        name: preferredChannels.name,
      })
      .from(brandPreferredChannels)
      .innerJoin(
        preferredChannels,
        eq(brandPreferredChannels.channelId, preferredChannels.id),
      )
      .where(eq(brandPreferredChannels.brandId, brandId));
  }

  async getBrandLanguages(brandId: string) {
    return db
      .select({
        id: athleteLanguages.id,
        name: athleteLanguages.name,
        code: athleteLanguages.code,
      })
      .from(brandRequiredLanguages)
      .innerJoin(
        athleteLanguages,
        eq(brandRequiredLanguages.languageId, athleteLanguages.id),
      )
      .where(eq(brandRequiredLanguages.brandId, brandId));
  }

  async countBrandHealthConditions(brandId: string) {
    const rows = await this.getBrandHealthConditions(brandId);
    return rows.length;
  }

  async countBrandCampaignObjectives(brandId: string) {
    const rows = await this.getBrandCampaignObjectives(brandId);
    return rows.length;
  }

  async countBrandPreferredChannels(brandId: string) {
    const rows = await this.getBrandPreferredChannels(brandId);
    return rows.length;
  }

  async countBrandLanguages(brandId: string) {
    const rows = await this.getBrandLanguages(brandId);
    return rows.length;
  }
}
