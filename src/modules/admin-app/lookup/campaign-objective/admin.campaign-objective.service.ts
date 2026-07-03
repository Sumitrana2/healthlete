import * as healthConditionsRepo from "./admin.campaign-objective.repository";

export async function getCampaignObjectives() {
  return await healthConditionsRepo.getAllCampaignObjectives();
}