import * as lookupRepo from "../../core/lookup/lookup.repository";
import * as brandRepo from "./brand.repository";
import { AppError } from "../../../middleware/errorHandler";

export async function addCompanyToBrand(
  brandId: string,
  data: {
    name: string;
    website: string;
    industryId: string;
    role: string;
  }
) {
  const industry = await lookupRepo.findIndustryById(data.industryId);
  if (!industry) {
    throw new AppError(404, "Industry not found", "NOT_FOUND");
  }

  let company = await lookupRepo.findCompanyByName(data.name.trim());

  if (!company) {
    company = await lookupRepo.createCompany({
      name: data.name.trim(),
      website: data.website,
      industryId: data.industryId,
      isActive: true,
    });
  }

  await brandRepo.updateBrandCompany(brandId, {
    companyId: company.id,
    role: data.role,
    onboardingStep: 2,
  });

  return company;
}

export async function addCampaignFocus(
  brandId: string,
  data: {
    healthConditionIds: string[];
    campaignObjectiveIds: string[];
  }
) {
  const healthConditions = await brandRepo.findHealthConditionsByIds(
    data.healthConditionIds
  );

  if (healthConditions.length !== data.healthConditionIds.length) {
    throw new AppError(
      400,
      "One or more health conditions are invalid",
      "INVALID_HEALTH_CONDITIONS"
    );
  }

  const campaignObjectives = await brandRepo.findCampaignObjectivesByIds(
    data.campaignObjectiveIds
  );

  if (campaignObjectives.length !== data.campaignObjectiveIds.length) {
    throw new AppError(
      400,
      "One or more campaign objectives are invalid",
      "INVALID_CAMPAIGN_OBJECTIVES"
    );
  }

  await brandRepo.deleteBrandHealthConditions(brandId);

  await brandRepo.insertBrandHealthConditions(
    brandId,
    data.healthConditionIds
  );

  await brandRepo.deleteBrandCampaignObjectives(brandId);

  await brandRepo.insertBrandCampaignObjectives(
    brandId,
    data.campaignObjectiveIds
  );

  await brandRepo.updateBrandOnboardingStep(brandId, 3);

  return {
    healthConditionIds: data.healthConditionIds,
    campaignObjectiveIds: data.campaignObjectiveIds,
  };
}

export async function addMediaLanguagePreferences(
  brandId: string,
  data: {
    preferredChannelIds: string[];
    languageIds: string[];
  }
) {
  
  const channels = await brandRepo.findPreferredChannelsByIds(
    data.preferredChannelIds
  );

  if (channels.length !== data.preferredChannelIds.length) {
    throw new AppError(
      400,
      "One or more preferred channels are invalid",
      "INVALID_CHANNELS"
    );
  }

  const languages = await brandRepo.findLanguagesByIds(
    data.languageIds
  );

  if (languages.length !== data.languageIds.length) {
    throw new AppError(
      400,
      "One or more languages are invalid",
      "INVALID_LANGUAGES"
    );
  }

  await brandRepo.deleteBrandPreferredChannels(brandId);

  await brandRepo.insertBrandPreferredChannels(
    brandId,
    data.preferredChannelIds
  );

  await brandRepo.deleteBrandRequiredLanguages(brandId);

  await brandRepo.insertBrandRequiredLanguages(
    brandId,
    data.languageIds
  );

  await brandRepo.updateBrandOnboardingStep(brandId, 4);

  return {
    preferredChannelIds: data.preferredChannelIds,
    languageIds: data.languageIds,
  };
}

export async function completeOnboarding(
  brandId: string
) {
  return brandRepo.completeOnboarding(brandId);
}

export async function getProfile(brandId: string) {
  const profile = await brandRepo.getProfile(brandId);
  return profile;
}