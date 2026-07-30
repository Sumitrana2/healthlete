import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BrandAuthGuard } from "../guards/brand-auth.guard";
import { Brand } from "../../../common/decorators/brand.decorator";
import { BrandRequestUser } from "../guards/brand-auth.guard";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";
import { ApiZodBody } from "../../../common/decorators/api-zod-body.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  completeOnboardingSchema,
  saveCampaignFocusSchema,
  saveCompanySchema,
  saveMediaLanguageSchema,
} from "../dto/brand-profile.dto";
import { BrandProfileService } from "../services/brand-profile.service";

@ApiTags("Brand Profile")
@Controller("brand/profile")
@UseGuards(BrandAuthGuard)
export class BrandProfileController {
  constructor(private readonly brandProfileService: BrandProfileService) {}

  @Get("me")
  @ApiOperation({ summary: "Get logged-in brand profile" })
  @ApiSuccessResponse("Profile fetched successfully")
  async getMe(@Brand() brand: BrandRequestUser) {
    const profile = await this.brandProfileService.getProfile(brand.id);
    return {
      success: true,
      message: "Profile fetched successfully",
      data: profile,
    };
  }

  @Post("company")
  @ApiOperation({ summary: "Add company to brand" })
  @ApiZodBody(saveCompanySchema, "BrandSaveCompanyBody")
  @ApiSuccessResponse("Company linked successfully")
  async saveCompany(
    @Brand() brand: BrandRequestUser,
    @Body(new ZodValidationPipe(saveCompanySchema))
    body: ReturnType<typeof saveCompanySchema.parse>,
  ) {
    const data = await this.brandProfileService.saveCompany(brand.id, body);
    return {
      success: true,
      message: "Company linked successfully",
      data,
    };
  }

  @Post("campaign-focus")
  @ApiOperation({ summary: "Add campaign focus" })
  @ApiZodBody(saveCampaignFocusSchema, "BrandSaveCampaignFocusBody")
  @ApiSuccessResponse("Campaign focus saved successfully")
  async saveCampaignFocus(
    @Brand() brand: BrandRequestUser,
    @Body(new ZodValidationPipe(saveCampaignFocusSchema))
    body: ReturnType<typeof saveCampaignFocusSchema.parse>,
  ) {
    const data = await this.brandProfileService.saveCampaignFocus(
      brand.id,
      body,
    );
    return {
      success: true,
      message: "Campaign focus saved successfully",
      data,
    };
  }

  @Post("media-language-preferences")
  @ApiOperation({ summary: "Save media & language preferences" })
  @ApiZodBody(saveMediaLanguageSchema, "BrandSaveMediaLanguagePreferencesBody")
  @ApiSuccessResponse("Media & language preferences saved successfully")
  async saveMediaLanguagePreferences(
    @Brand() brand: BrandRequestUser,
    @Body(new ZodValidationPipe(saveMediaLanguageSchema))
    body: ReturnType<typeof saveMediaLanguageSchema.parse>,
  ) {
    const data = await this.brandProfileService.saveMediaLanguagePreferences(
      brand.id,
      body,
    );
    return {
      success: true,
      message: "Media & language preferences saved successfully",
      data,
    };
  }

  @Post("complete-onboarding")
  @ApiOperation({ summary: "Complete brand onboarding" })
  @ApiZodBody(completeOnboardingSchema, "BrandCompleteOnboardingBody")
  @ApiSuccessResponse("Onboarding completed successfully")
  async completeOnboarding(
    @Brand() brand: BrandRequestUser,
    @Body(new ZodValidationPipe(completeOnboardingSchema))
    body: ReturnType<typeof completeOnboardingSchema.parse>,
  ) {
    const data = await this.brandProfileService.completeOnboarding(
      brand.id,
      body,
    );
    return {
      success: true,
      message: "Onboarding completed successfully",
      data,
    };
  }
}
