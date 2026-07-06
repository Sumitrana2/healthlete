import { z } from "zod";

export const createHealthConditionSchema = z.object({
  name: z.string().min(1).max(150),
});

export const updateHealthConditionSchema = z.object({
  name: z.string().trim().min(2).max(150),
});


export const healthConditionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});