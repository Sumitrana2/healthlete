import { z } from "zod";

export const addCompanySchema = z.object({
  name: z.string().trim().min(2).max(150),
  website: z.string().url().optional(),
  industryId: z.string().uuid(),
  role: z.string().trim().min(2).max(100),
});

export const companyResponse = z.object({
  id: z.string().uuid(),
  name: z.string(),
  website: z.string().nullable(),
  industryId: z.string().uuid().nullable(),
});

export const profileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string().nullable(),

  onboardingStep: z.number(),
  isOnboardingComplete: z.boolean(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]),

  company: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      website: z.string().nullable(),
      industry: z
        .object({
          id: z.string().uuid(),
          name: z.string(),
        })
        .nullable(),
    })
    .nullable(),

  healthConditions: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
    })
  ),

  campaignObjectives: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
    })
  ),

  preferredChannels: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
    })
  ),

  languages: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      code: z.string(),
    })
  ),
});

export const addCampaignFocusSchema = z.object({
  healthConditionIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one health condition"),

  campaignObjectiveIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one campaign objective"),
});

export const mediaLanguagePreferencesSchema = z.object({
  preferredChannelIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one preferred channel"),

  languageIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one language"),
});

export const completeOnboardingSchema = z.object({
  acceptTerms: z.literal(true, {
    errorMap: () => ({
      message: "Terms & Conditions must be accepted",
    }),
  }),
});