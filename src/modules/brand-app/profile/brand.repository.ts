import { eq, inArray } from "drizzle-orm";
import { db } from "../../../db";
import {
  athleteLanguages,
  brandCampaignObjectives,
  brandHealthConditions,
  brandPreferredChannels,
  brandRequiredLanguages,
  brands,
  campaignObjectives,
  healthConditions,
  preferredChannels,
} from "../../../db/schema";

export async function updateBrandCompany(
  brandId: string,
  data: {
    companyId: string;
    role: string;
    onboardingStep: number;
  }
) {
  const [brand] = await db
    .update(brands)
    .set({
      companyId: data.companyId,
      role: data.role,
      onboardingStep: data.onboardingStep,
      updatedAt: new Date(),
    })
    .where(eq(brands.id, brandId))
    .returning();

  return brand;
}

export async function findHealthConditionsByIds(ids: string[]) {
  return db
    .select({ id: healthConditions.id })
    .from(healthConditions)
    .where(inArray(healthConditions.id, ids));
}

export async function findCampaignObjectivesByIds(ids: string[]) {
  return db
    .select({ id: campaignObjectives.id })
    .from(campaignObjectives)
    .where(inArray(campaignObjectives.id, ids));
}

export async function deleteBrandHealthConditions(brandId: string) {
  await db
    .delete(brandHealthConditions)
    .where(eq(brandHealthConditions.brandId, brandId));
}

export async function insertBrandHealthConditions(
  brandId: string,
  ids: string[]
) {
  await db.insert(brandHealthConditions).values(
    ids.map((id) => ({
      brandId,
      healthConditionId: id,
    }))
  );
}

export async function deleteBrandCampaignObjectives(brandId: string) {
  await db
    .delete(brandCampaignObjectives)
    .where(eq(brandCampaignObjectives.brandId, brandId));
}
export async function insertBrandCampaignObjectives(
  brandId: string,
  ids: string[]
) {
  await db.insert(brandCampaignObjectives).values(
    ids.map((id) => ({
      brandId,
      campaignObjectiveId: id,
    }))
  );
}

export async function updateBrandOnboardingStep(brandId: string, step: number) {
  await db
    .update(brands)
    .set({
      onboardingStep: step,
      updatedAt: new Date(),
    })
    .where(eq(brands.id, brandId));
}

export async function findPreferredChannelsByIds(ids: string[]) {
  return db
    .select({ id: preferredChannels.id })
    .from(preferredChannels)
    .where(inArray(preferredChannels.id, ids));
}

export async function findLanguagesByIds(ids: string[]) {
  return db
    .select({ id: athleteLanguages.id })
    .from(athleteLanguages)
    .where(inArray(athleteLanguages.id, ids));
}

export async function deleteBrandPreferredChannels(brandId: string) {
  await db
    .delete(brandPreferredChannels)
    .where(eq(brandPreferredChannels.brandId, brandId));
}
export async function insertBrandPreferredChannels(
  brandId: string,
  ids: string[]
) {
  await db.insert(brandPreferredChannels).values(
    ids.map((id) => ({
      brandId,
      channelId: id,
    }))
  );
}
export async function deleteBrandRequiredLanguages(brandId: string) {
  await db
    .delete(brandRequiredLanguages)
    .where(eq(brandRequiredLanguages.brandId, brandId));
}

export async function insertBrandRequiredLanguages(
  brandId: string,
  ids: string[]
) {
  await db.insert(brandRequiredLanguages).values(
    ids.map((id) => ({
      brandId,
      languageId: id,
    }))
  );
}

export async function completeOnboarding(brandId: string) {
  const [brand] = await db
    .update(brands)
    .set({
      onboardingStep: 5,
      isOnboardingComplete: true,
      isTermsConditionsAccepted: true,
      updatedAt: new Date(),
    })
    .where(eq(brands.id, brandId))
    .returning();

  return brand;
}

export async function getProfile(brandId: string) {
  const brand = await db.query.brands.findFirst({
    where: eq(brands.id, brandId),

    with: {
      company: {
        with: {
          industry: true,
        },
      },

      healthConditions: {
        with: {
          healthCondition: true,
        },
      },

      campaignObjectives: {
        with: {
          campaignObjective: true,
        },
      },

      preferredChannels: {
        with: {
          channel: true,
        },
      },

      requiredLanguages: {
        with: {
          language: true,
        },
      },
    },
  });

  if (!brand) return null;

  return {
    id: brand.id,
    email: brand.email,
    firstName: brand.firstName,
    lastName: brand.lastName,
    role: brand.role,

    onboardingStep: brand.onboardingStep,
    isOnboardingComplete: brand.isOnboardingComplete,
    approvalStatus: brand.approvalStatus,

    company: brand.company
      ? {
          id: brand.company.id,
          name: brand.company.name,
          website: brand.company.website,
          industry: brand.company.industry
            ? {
                id: brand.company.industry.id,
                name: brand.company.industry.name,
              }
            : null,
        }
      : null,

    healthConditions: brand.healthConditions.map((h) => ({
      id: h.healthCondition.id,
      name: h.healthCondition.name,
    })),

    campaignObjectives: brand.campaignObjectives.map((c) => ({
      id: c.campaignObjective.id,
      name: c.campaignObjective.name,
    })),

    preferredChannels: brand.preferredChannels.map((c) => ({
      id: c.channel.id,
      name: c.channel.name,
    })),

    languages: brand.requiredLanguages.map((l) => ({
      id: l.language.id,
      name: l.language.name,
      code: l.language.code,
    })),
  };
}
