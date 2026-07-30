import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const uuidSchema = z.string().uuid();

export const saveCompanySchema = z
  .object({
    companyId: uuidSchema.optional(),
    name: z.string().trim().min(1).max(255),
    website: z.string().trim().min(1).max(255),
    industryId: uuidSchema,
    role: z.string().trim().min(1).max(100),
  })
  .openapi("BrandSaveCompanyBody");

export const saveCampaignFocusSchema = z
  .object({
    healthConditionIds: z.array(uuidSchema).min(1),
    campaignObjectiveIds: z.array(uuidSchema).min(1),
  })
  .openapi("BrandSaveCampaignFocusBody");

export const saveMediaLanguageSchema = z
  .object({
    preferredChannelIds: z.array(uuidSchema).min(1),
    languageIds: z.array(uuidSchema).min(1),
  })
  .openapi("BrandSaveMediaLanguagePreferencesBody");

export const completeOnboardingSchema = z
  .object({
    acceptTerms: z.literal(true),
  })
  .openapi("BrandCompleteOnboardingBody");

export type SaveCompanyInput = z.infer<typeof saveCompanySchema>;
export type SaveCampaignFocusInput = z.infer<typeof saveCampaignFocusSchema>;
export type SaveMediaLanguageInput = z.infer<typeof saveMediaLanguageSchema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
