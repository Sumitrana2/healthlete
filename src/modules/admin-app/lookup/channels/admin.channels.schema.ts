import { z } from "zod";

export const createChannelsSchema = z.object({
  name: z.string().min(1).max(150),
});


export const updatePreferredChannelSchema =createChannelsSchema

export const channelSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});