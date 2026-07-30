import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const searchAthleteSchema = z
  .object({
    /** Admin frontend sends `query`; keep `search` as alias. */
    query: z.string().trim().min(1).max(100).optional().openapi({ example: "virat" }),
    search: z.string().trim().min(1).max(100).optional().openapi({ example: "virat" }),
    st: z.string().optional().default(""),
    exclSt: z.string().optional().default(""),
  })
  .refine((data) => Boolean(data.query ?? data.search), {
    message: "Search query is required",
    path: ["query"],
  })
  .transform((data) => ({
    search: (data.query ?? data.search) as string,
    st: data.st ?? "",
    exclSt: data.exclSt ?? "",
  }))
  .openapi("SearchAthleteQuery");

export const searchExistingAthleteSchema = z
  .object({
    name: z.string().trim().min(1).max(100).openapi({ example: "virat" }),
  })
  .openapi("SearchExistingAthleteQuery");

export const syncPlatformSchema = z
  .object({
    provider: z.literal("hyperauditor"),
    platform: z.object({
      platform: z.string().min(1),
      username: z.string().min(1),
      social_id: z.string().min(1),
      display_title: z.string().min(1),
      avatar_url: z.string().optional().default(""),
      subscribers_count: z.coerce.number().int().nonnegative().default(0),
      is_verified: z.boolean().optional().default(false),
    }),
  })
  .openapi("SyncPlatformBody");

export const syncAthleteDataSchema = z
  .object({
    provider: z.literal("hyperauditor").optional().default("hyperauditor"),
  })
  .openapi("SyncAthleteDataBody");

export const selectedAthleteAccountSchema = z
  .object({
    title: z.string().min(1),
    avatar_url: z.string().optional(),
    subscribers_count: z.number().int().nonnegative(),
    is_private: z.boolean().optional().default(false),
    is_verified: z.boolean().optional().default(false),
    username: z.string().min(1),
    user_id: z.string().min(1),
    type: z.string().min(1),
  })
  .openapi("SelectedAthleteAccount");

export const createManualAthleteFieldSchema = z
  .object({
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
    tags: z.array(z.string().trim().min(1)).optional().default([]),
    health_conditions: z.array(z.string().uuid()).optional().default([]),
    description: z.string().trim().max(5000).optional().default(""),
    country: z.string().trim().min(1).max(100),
    image: z.string().trim().optional(),
    avatar_url: z.string().trim().optional(),
  })
  .openapi("CreateManualAthleteBody");

export const createManualAthleteSchema = createManualAthleteFieldSchema;

export const updateManualAthleteFieldSchema = z
  .object({
    first_name: z.string().trim().min(1).max(100).optional(),
    last_name: z.string().trim().min(1).max(100).optional(),
    tags: z.array(z.string().trim().min(1)).optional(),
    health_conditions: z.array(z.string().uuid()).optional(),
    description: z.string().trim().max(5000).optional(),
    country: z.string().trim().min(1).max(100).optional(),
    image: z.string().trim().optional(),
    avatar_url: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      Object.values(data).some((value) => value !== undefined && value !== ""),
    { message: "At least one field is required" },
  )
  .openapi("UpdateManualAthleteBody");

export const addPlatformsSchema = z
  .object({
    accounts: z.array(selectedAthleteAccountSchema).min(1),
    existing_athlete_id: z.string().uuid().optional(),
  })
  .openapi("AddPlatformsBody");

export type SelectedAthleteAccountInput = z.infer<
  typeof selectedAthleteAccountSchema
>;
export type CreateManualAthleteInput = z.infer<typeof createManualAthleteFieldSchema>;
export type UpdateManualAthleteInput = z.infer<typeof updateManualAthleteFieldSchema>;
export type AddPlatformsInput = z.infer<typeof addPlatformsSchema>;
export type SyncPlatformInput = z.infer<typeof syncPlatformSchema>;
export type SyncAthleteDataInput = z.infer<typeof syncAthleteDataSchema>;

/** Convert admin frontend sync-platform payload into internal accounts format. */
export function syncPlatformToAddPlatforms(
  input: SyncPlatformInput,
): AddPlatformsInput {
  const platform = input.platform;
  return {
    accounts: [
      {
        title: platform.display_title,
        avatar_url: platform.avatar_url || undefined,
        subscribers_count: platform.subscribers_count,
        is_verified: platform.is_verified,
        is_private: false,
        username: platform.username,
        user_id: platform.social_id,
        type: platform.platform,
      },
    ],
  };
}
