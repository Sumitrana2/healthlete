import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BrandAuthGuard } from "../../brand/guards/brand-auth.guard";
import { UseGuards } from "@nestjs/common";
import { ChannelsService } from "../services/channels.service";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";

@ApiTags("Brand Onboarding")
@Controller("brand/channels")
@UseGuards(BrandAuthGuard)
export class BrandChannelsController {
  constructor(private readonly brandChannelsService: ChannelsService) {}

  @Get()
  @ApiOperation({ summary: "Get all active channels" })
  @ApiSuccessResponse("Channels fetched successfully")
  async list() {
    const results = await this.brandChannelsService.getPreferredChannels();
    return { success: true, message: "Channels fetched successfully", data: { channels: results } };
  }
}
