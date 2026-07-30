import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BrandAuthGuard } from "../../../brand/guards/brand-auth.guard";
import { UseGuards } from "@nestjs/common";
import { CampaignObjectiveService } from "../services/campaign.objective.service";
import { ApiSuccessResponse } from "../../../../common/decorators/api-response.decorator";

@ApiTags("Brand Onboarding")
@Controller("brand/campaign-objectives")
@UseGuards(BrandAuthGuard)
export class BrandCampaignObjectiveController {
  constructor(private readonly brandCampaignObjectiveService: CampaignObjectiveService) {}

  @Get()
  @ApiOperation({ summary: "Get all active campaign objectives" })
  @ApiSuccessResponse("Campaign objectives fetched successfully")
  async list() {
    const results = await this.brandCampaignObjectiveService.getCampaignObjectives();
    return { success: true, message: "Campaign objectives fetched successfully", data: { campaignObjectives: results } };
  }
}
