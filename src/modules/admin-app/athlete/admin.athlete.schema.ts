import { z } from "zod";
import { jsonArray } from "../../../utils/zod.helpers";

export const createAthleteBodySchema = z.object({
  firstName: z.string().min(2, "First name required").max(255),
  lastName: z.string().min(2, "Last name required").max(255),
  country: z.string().max(100),
  description: z.string(),
  // isActive: z.boolean(),
  tags: jsonArray(z.string()),
  healthConditionIds: jsonArray(z.string().uuid()),
});

export const updateAthleteBodySchema = z.object({
  firstName: z
    .string()
    .optional()
    .transform((val) => val || undefined)
    .refine((val) => !val || val.length >= 2, {
      message: "First name must be at least 2 characters",
    }),
  lastName: z
    .string()
    .optional()
    .transform((val) => val || undefined)
    .refine((val) => !val || val.length >= 2, {
      message: "Last name must be at least 2 characters",
    }),
  country: z.string().optional().transform((val) => val || undefined),
  description: z.string().optional().transform((val) => val || undefined),
  tags: jsonArray(z.string()),
  healthConditionIds: jsonArray(z.string().uuid()),
  isActive: z
    .union([z.boolean(), z.string().transform((val) => val === "true")])
    .optional(),
});
export const updateAthleteSchema = z.object({
  body: updateAthleteBodySchema,
});

export const createAthleteSchema = z.object({
  body: createAthleteBodySchema,
});

export type CreateAthleteSchema = z.infer<typeof createAthleteSchema>;
export type UpdateAthleteSchema = z.infer<typeof updateAthleteSchema>;
export const AthleteSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  slug: z.string(),
  country: z.string().nullable(),
  description: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  tags: z.array(z.string()).nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
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
