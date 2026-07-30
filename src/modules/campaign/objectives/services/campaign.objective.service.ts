import { Injectable } from "@nestjs/common";
import { CampaignObjectiveRepository } from "../repositories/campaign.objective.repository";

@Injectable()
export class CampaignObjectiveService {
  constructor(private readonly repository: CampaignObjectiveRepository) {}

  async getCampaignObjectives() {
    return this.repository.getAllCampaignObjectives();
  }
}
