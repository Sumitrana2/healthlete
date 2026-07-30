import { Injectable } from "@nestjs/common";
import { AppError } from "../../../common/exceptions/app.error";
import type {
  CompleteOnboardingInput,
  SaveCampaignFocusInput,
  SaveCompanyInput,
  SaveMediaLanguageInput,
} from "../dto/brand-profile.dto";
import { BrandProfileRepository } from "../repositories/brand-profile.repository";

@Injectable()
export class BrandProfileService {
  constructor(private readonly repository: BrandProfileRepository) {}

  async getProfile(brandId: string) {
    const brand = await this.repository.findBrandById(brandId);
    if (!brand) {
      throw new AppError(404, "Brand not found", "NOT_FOUND");
    }

    const company = brand.companyId
      ? await this.repository.findCompanyById(brand.companyId)
      : null;

    const [
      healthConditions,
      campaignObjectives,
      preferredChannels,
      languages,
    ] = await Promise.all([
      this.repository.getBrandHealthConditions(brandId),
      this.repository.getBrandCampaignObjectives(brandId),
      this.repository.getBrandPreferredChannels(brandId),
      this.repository.getBrandLanguages(brandId),
    ]);

    return {
      id: brand.id,
      email: brand.email,
      firstName: brand.firstName,
      lastName: brand.lastName,
      role: brand.role ?? "",
      onboardingStep: brand.companyId ? brand.onboardingStep : 0,
      isOnboardingComplete: brand.isOnboardingComplete ?? false,
      approvalStatus: brand.approvalStatus ?? "pending",
      company: company
        ? {
            id: company.id,
            name: company.name,
            website: company.website ?? "",
            industry: company.industry?.id
              ? {
                  id: company.industry.id,
                  name: company.industry.name,
                }
              : null,
          }
        : null,
      healthConditions,
      campaignObjectives,
      preferredChannels,
      languages,
    };
  }

  async saveCompany(brandId: string, input: SaveCompanyInput) {
    const brand = await this.repository.findBrandById(brandId);
    if (!brand) {
      throw new AppError(404, "Brand not found", "NOT_FOUND");
    }

    const industry = await this.repository.findIndustryById(input.industryId);
    if (!industry) {
      throw new AppError(404, "Brand or Industry not found", "NOT_FOUND");
    }

    let companyId = input.companyId;

    if (companyId) {
      const existingCompany = await this.repository.findCompanyById(companyId);
      if (!existingCompany) {
        throw new AppError(404, "Brand or Industry not found", "NOT_FOUND");
      }

      await this.repository.updateCompany(companyId, {
        name: input.name,
        website: input.website,
        industryId: input.industryId,
      });
    } else {
      const created = await this.repository.createCompany({
        name: input.name,
        website: input.website,
        industryId: input.industryId,
      });
      companyId = created.id;
    }

    await this.repository.linkBrandToCompany(
      brandId,
      companyId,
      input.role,
      1,
    );

    return {
      id: companyId,
      name: input.name.trim(),
      website: input.website.trim(),
      industryId: input.industryId,
    };
  }

  async saveCampaignFocus(brandId: string, input: SaveCampaignFocusInput) {
    const brand = await this.repository.findBrandById(brandId);
    if (!brand) {
      throw new AppError(404, "Brand not found", "NOT_FOUND");
    }

    const uniqueHealthConditionIds = [...new Set(input.healthConditionIds)];
    const uniqueCampaignObjectiveIds = [...new Set(input.campaignObjectiveIds)];

    const [healthConditionCount, campaignObjectiveCount] = await Promise.all([
      this.repository.countActiveHealthConditions(uniqueHealthConditionIds),
      this.repository.countActiveCampaignObjectives(uniqueCampaignObjectiveIds),
    ]);

    if (
      healthConditionCount !== uniqueHealthConditionIds.length ||
      campaignObjectiveCount !== uniqueCampaignObjectiveIds.length
    ) {
      throw new AppError(
        400,
        "Invalid health condition or campaign objective ids",
        "VALIDATION_ERROR",
      );
    }

    await this.repository.replaceHealthConditions(
      brandId,
      uniqueHealthConditionIds,
    );
    await this.repository.replaceCampaignObjectives(
      brandId,
      uniqueCampaignObjectiveIds,
    );
    await this.repository.updateBrandOnboarding(brandId, { onboardingStep: 2 });

    return {
      healthConditionIds: uniqueHealthConditionIds,
      campaignObjectiveIds: uniqueCampaignObjectiveIds,
    };
  }

  async saveMediaLanguagePreferences(
    brandId: string,
    input: SaveMediaLanguageInput,
  ) {
    const brand = await this.repository.findBrandById(brandId);
    if (!brand) {
      throw new AppError(404, "Brand not found", "NOT_FOUND");
    }

    const uniqueChannelIds = [...new Set(input.preferredChannelIds)];
    const uniqueLanguageIds = [...new Set(input.languageIds)];

    const [channelCount, languageCount] = await Promise.all([
      this.repository.countActivePreferredChannels(uniqueChannelIds),
      this.repository.countActiveLanguages(uniqueLanguageIds),
    ]);

    if (
      channelCount !== uniqueChannelIds.length ||
      languageCount !== uniqueLanguageIds.length
    ) {
      throw new AppError(
        400,
        "Invalid preferred channel or language ids",
        "VALIDATION_ERROR",
      );
    }

    await this.repository.replacePreferredChannels(brandId, uniqueChannelIds);
    await this.repository.replaceRequiredLanguages(brandId, uniqueLanguageIds);
    await this.repository.updateBrandOnboarding(brandId, { onboardingStep: 3 });

    return {
      preferredChannelIds: uniqueChannelIds,
      languageIds: uniqueLanguageIds,
    };
  }

  async completeOnboarding(brandId: string, input: CompleteOnboardingInput) {
    const brand = await this.repository.findBrandById(brandId);
    if (!brand) {
      throw new AppError(404, "Brand not found", "NOT_FOUND");
    }

    if (!brand.companyId) {
      throw new AppError(
        400,
        "Complete company profile before finishing onboarding",
        "VALIDATION_ERROR",
      );
    }

    const [
      healthConditionCount,
      campaignObjectiveCount,
      channelCount,
      languageCount,
    ] = await Promise.all([
      this.repository.countBrandHealthConditions(brandId),
      this.repository.countBrandCampaignObjectives(brandId),
      this.repository.countBrandPreferredChannels(brandId),
      this.repository.countBrandLanguages(brandId),
    ]);

    if (
      healthConditionCount === 0 ||
      campaignObjectiveCount === 0 ||
      channelCount === 0 ||
      languageCount === 0
    ) {
      throw new AppError(
        400,
        "Complete all onboarding steps before submitting",
        "VALIDATION_ERROR",
      );
    }

    await this.repository.updateBrandOnboarding(brandId, {
      onboardingStep: 3,
      isOnboardingComplete: true,
    });

    return {
      acceptTerms: input.acceptTerms,
    };
  }
}
