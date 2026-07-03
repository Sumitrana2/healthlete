import { db } from "../../../db";
import { campaignObjectives } from "../../../db/schema";
import { eq } from "drizzle-orm";

export async function getAllCampaignObjectives() {
  return await db
    .select({
      id: campaignObjectives.id,
      name: campaignObjectives.name,
    })
    .from(campaignObjectives)
    .where(eq(campaignObjectives.isActive, true));
}