import { z } from "zod";

export const createCampaignObjectiveSchema = z.object({
  name: z.string().min(1).max(150),
});