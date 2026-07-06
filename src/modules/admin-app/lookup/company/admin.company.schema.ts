import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(150),
  website: z.string().url().optional(),
  industryId: z.string().uuid(),
});