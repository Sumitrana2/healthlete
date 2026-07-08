import { z } from "zod";
import { jsonArray } from "../../../utils/zod.helpers";

export const createAthleteBodySchema = z.object({
  fullName: z.string().min(2, "Full name required").max(255),
  country: z.string().max(100),
  description: z.string(),
  tags: jsonArray(z.string()),
  healthConditionIds: jsonArray(
    z.string().uuid()
  ),
});

export const createAthleteSchema = z.object({
  body: createAthleteBodySchema,
});

export type CreateAthleteSchema =
  z.infer<typeof createAthleteSchema>;