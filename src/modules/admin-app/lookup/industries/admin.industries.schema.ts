import { z } from "zod";

export const createIndustrySchema = z.object({
  name: z.string().min(1).max(150),
});