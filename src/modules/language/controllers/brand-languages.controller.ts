import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BrandAuthGuard } from "../../brand/guards/brand-auth.guard";
import { UseGuards } from "@nestjs/common";
import { LanguagesService } from "../services/languages.service";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";

@ApiTags("Brand Onboarding")
@Controller("brand/languages")
@UseGuards(BrandAuthGuard)
export class BrandLanguagesController {
  constructor(private readonly brandLanguagesService: LanguagesService) {}

  @Get()
  @ApiOperation({ summary: "Get all active languages" })
  @ApiSuccessResponse("Languages fetched successfully")
  async list() {
    const results = await this.brandLanguagesService.getAthleteLanguages();
    return { success: true, message: "Languages fetched successfully", data: { languages: results } };
  }
}
