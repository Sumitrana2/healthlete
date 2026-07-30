import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BrandAuthGuard } from "../../brand/guards/brand-auth.guard";
import { UseGuards } from "@nestjs/common";
import { HealthConditionService } from "../services/health.condition.service";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";

@ApiTags("Brand Onboarding")
@Controller("brand/health-conditions")
@UseGuards(BrandAuthGuard)
export class BrandHealthConditionController {
  constructor(private readonly brandHealthConditionService: HealthConditionService) {}

  @Get()
  @ApiOperation({ summary: "Get all active health conditions" })
  @ApiSuccessResponse("Health conditions fetched successfully")
  async list() {
    const results = await this.brandHealthConditionService.getHealthConditions();
    return { success: true, message: "Health conditions fetched successfully", data: { healthConditions: results } };
  }
}
