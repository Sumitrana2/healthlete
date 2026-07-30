import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { BrandModule } from "../brand/brand.module";
import { BrandCampaignObjectiveController } from "./objectives/controllers/brand-campaign-objective.controller";
import { AdminCampaignObjectiveController } from "./objectives/controllers/admin-campaign-objective.controller";
import { CampaignObjectiveService } from "./objectives/services/campaign.objective.service";
import { AdminCampaignObjectiveService } from "./objectives/services/admin-campaign.objective.service";
import { CampaignObjectiveRepository } from "./objectives/repositories/campaign.objective.repository";

@Module({
  imports: [BrandModule, AdminModule],
  controllers: [
    BrandCampaignObjectiveController,
    AdminCampaignObjectiveController,
  ],
  providers: [
    CampaignObjectiveService,
    AdminCampaignObjectiveService,
    CampaignObjectiveRepository,
  ],
  exports: [CampaignObjectiveService, CampaignObjectiveRepository],
})
export class CampaignModule {}
