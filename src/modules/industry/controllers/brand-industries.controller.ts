import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BrandAuthGuard } from "../../brand/guards/brand-auth.guard";
import { UseGuards } from "@nestjs/common";
import { IndustriesService } from "../services/industries.service";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";

@ApiTags("Brand Onboarding")
@Controller("brand/industries")
@UseGuards(BrandAuthGuard)
export class BrandIndustriesController {
  constructor(private readonly brandIndustriesService: IndustriesService) {}

  @Get()
  @ApiOperation({ summary: "Get all active industries" })
  @ApiSuccessResponse("Industries fetched successfully")
  async list() {
    const results = await this.brandIndustriesService.getIndustries();
    return { success: true, message: "Industries fetched successfully", data: { industries: results } };
  }
}
