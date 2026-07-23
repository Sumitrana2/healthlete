import { z } from "zod";

export const brandListQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.enum(["true", "false"]).optional(),
  approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(), 
  companyId: z.string().uuid().optional(),
  industryId: z.string().uuid().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const brandIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateBrandStatusBodySchema = z.object({
  isActive: z.boolean(),
});

export const updateBrandStatusSchema = z.object({
  body: updateBrandStatusBodySchema,
});

export type UpdateBrandStatusSchema = z.infer<typeof updateBrandStatusSchema>;

export const BrandSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.string().nullable(),
  companyId: z.string().uuid().nullable(),
  onboardingStep: z.number(),
  isOnboardingComplete: z.boolean().nullable(),
  isEmailVerified: z.boolean().nullable(),
  approvalStatus: z.string().nullable(),
  isActive: z.boolean().nullable(),
  isTermsConditionsAccepted: z.boolean().nullable(),
  lastLoginAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  company: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      website: z.string().nullable(),
      logoUrl: z.string().nullable(),
      country: z.string().nullable(),
      industry: z.object({ id: z.string().uuid(), name: z.string() }).nullable().optional(),
      companySize: z.object({ id: z.string().uuid(), label: z.string() }).nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const BrandDetailSchema = BrandSchema.extend({
  healthConditions: z
    .array(
      z.object({
        healthCondition: z.object({ id: z.string().uuid(), name: z.string() }),
      })
    )
    .optional(),
  campaignObjectives: z
    .array(
      z.object({
        campaignObjective: z.object({ id: z.string().uuid(), name: z.string() }),
      })
    )
    .optional(),
  preferredChannels: z
    .array(
      z.object({
        channel: z.object({ id: z.string().uuid(), name: z.string() }),
      })
    )
    .optional(),
  requiredLanguages: z
    .array(
      z.object({
        language: z.object({ id: z.string().uuid(), name: z.string(), code: z.string() }),
      })
    )
    .optional(),
});