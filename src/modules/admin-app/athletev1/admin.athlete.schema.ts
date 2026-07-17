import { z } from "zod";
import { jsonArray } from "../../../utils/zod.helpers";

export const selectedPlatformSchema = z.object({
  platform: z.enum(["instagram", "youtube", "twitter"]),
  username: z.string().min(1, "Username is required"),
  social_id: z.string().min(1, "Social ID is required"),
  display_title: z.string().min(1, "Display title is required"),
  avatar_url: z.string().url("Avatar URL must be a valid URL"),
  subscribers_count: z.number().optional(),
  is_verified: z.boolean()
});

// ── Create new athlete with first platform ────────────────────────────────────
export const createAthleteBodySchema = z.object({
  provider: z.enum(["hyperauditor"]),
  platform: selectedPlatformSchema,
});

export const createAthleteSchema = z.object({
  body: createAthleteBodySchema,
});

// ── Add platform to existing athlete ───────────────────────────────────────────
export const addPlatformBodySchema = z.object({
  provider: z.enum(["hyperauditor"]),
  platform: selectedPlatformSchema,
});

export const addPlatformSchema = z.object({
  body: addPlatformBodySchema,
  
});

export type CreateAthleteSchema = z.infer<typeof createAthleteSchema>;
export type AddPlatformSchema = z.infer<typeof addPlatformSchema>;

// ── Update ──────────────────────────────────────────────────────────────────────
export const updateAthleteBodySchema = z.object({
  description: z.string().optional().transform((val) => val || undefined),
  healthConditionIds: jsonArray(z.string().uuid()),
  isActive: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .optional(),
});

export const updateAthleteSchema = z.object({
  body: updateAthleteBodySchema,
});

export type UpdateAthleteSchema = z.infer<typeof updateAthleteSchema>;

// ── Response Schema ──────────────────────────────────────────────────────────────
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