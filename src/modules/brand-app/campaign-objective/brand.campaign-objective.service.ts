import * as healthConditionsRepo from "./brand.campaign-objective.repository";

export async function getCampaignObjectives() {
  return await healthConditionsRepo.getAllCampaignObjectives();
}