import { z } from "zod";

export const createHealthConditionSchema = z.object({
  name: z.string().min(1).max(150),
});