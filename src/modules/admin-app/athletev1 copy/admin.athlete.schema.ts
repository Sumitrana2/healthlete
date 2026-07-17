import { z } from "zod";
import { jsonArray } from "../../../utils/zod.helpers";

export const selectedPlatformSchema = z.object({
  platform: z.enum(["instagram", "youtube", "twitter", "tiktok", "twitch"]),
  username: z.string(),
  social_id: z.string(),
  display_title: z.string(),
  avatar_url: z.string().nullable().optional(),
  subscribers_count: z.number().optional(),
  is_verified: z.boolean().optional().default(false),
});

export const syncAthleteBodySchema = z.object({
  provider: z.enum(["hyperauditor"]),
  platform: selectedPlatformSchema,
  athleteId: z.string().uuid().optional(),
});

export const syncAthleteSchema = z.object({
  body: syncAthleteBodySchema,
});

export const updateAthleteBodySchema = z.object({
  fullName: z
    .string()
    .optional()
    .transform((val) => val || undefined)
    .refine((val) => !val || val.length >= 2, {
      message: "Full name must be at least 2 characters",
    }),
  country: z.string().optional().transform((val) => val || undefined),
  description: z.string().optional().transform((val) => val || undefined),
  healthConditionIds: jsonArray(z.string().uuid()),
  isActive: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .optional(),
});

export const updateAthleteSchema = z.object({
  body: updateAthleteBodySchema,
});

export type SyncAthleteSchema = z.infer<typeof syncAthleteSchema>;
export type UpdateAthleteSchema = z.infer<typeof updateAthleteSchema>;

export const AthleteSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  slug: z.string(),
  country: z.string().nullable(),
  description: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  isActive: z.boolean().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  platformLinks: z
    .array(
      z.object({
        id: z.string().uuid(),
        provider: z.string(),
        platform: z.string(),
        username: z.string().nullable(),
        displayTitle: z.string().nullable(),
        subscribersCount: z.number().nullable(),
        isVerified: z.boolean(),
        reportState: z.string(),
      })
    )
    .optional(),
  healthConditions: z
    .array(
      z.object({
        id: z.string().uuid(),
        healthCondition: z.object({
          id: z.string().uuid(),
          name: z.string(),
        }),
      })
    )
    .optional(),
});