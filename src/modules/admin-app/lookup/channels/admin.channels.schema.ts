import { z } from "zod";

export const createChannelsSchema = z.object({
  name: z.string().min(1).max(150),
});