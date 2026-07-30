import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { BrandAuthGuard } from "../../brand/guards/brand-auth.guard";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { searchCompanySchema } from "../dto/company.dto";
import { CompanyService } from "../services/company.service";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";

@ApiTags("Brand Onboarding")
@Controller("brand/company")
@UseGuards(BrandAuthGuard)
export class BrandCompanyController {
  constructor(private readonly brandCompanyService: CompanyService) {}

  @Get("search")
  @ApiOperation({ summary: "Search companies by name" })
  @ApiSuccessResponse("Companies fetched successfully")
  async list(
    @Query(new ZodValidationPipe(searchCompanySchema)) query: { search: string },
  ) {
    const results = await this.brandCompanyService.searchCompanies(query.search);
    return {
      success: true,
      message: "Companies fetched successfully",
      data: { companies: results },
    };
  }
}
