import { z } from "zod";

export const createIndustrySchema = z.object({
  name: z.string().min(1).max(150),
});

export const updateIndustrySchema = z.object({
  name: z.string().trim().min(2).max(150),
});

export const industrySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});