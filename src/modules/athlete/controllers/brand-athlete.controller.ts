import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { z } from "zod";
import { BrandAuthGuard } from "../../brand/guards/brand-auth.guard";
import type { BrandRequestUser } from "../../brand/guards/brand-auth.guard";
import { Brand } from "../../../common/decorators/brand.decorator";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";
import { ApiListQuery } from "../../../common/decorators/api-list-query.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { AppError } from "../../../common/exceptions/app.error";
import { AthleteDiscoverService } from "../services/athlete-discover.service";
import { AthleteProfileService } from "../services/athlete-profile.service";
import {
  brandAthleteDetailQuerySchema,
  brandAthletesListQuerySchema,
  type BrandAthleteDetailQuery,
  type BrandAthletesListQuery,
} from "../dto/brand-athlete.dto";

const athleteIdentifierParamSchema = z.object({
  id: z.string().min(1),
});

@ApiTags("Brand Athletes")
@ApiBearerAuth("brand-access-token")
@ApiCookieAuth("brand_access_token")
@Controller("brand/athletes")
@UseGuards(BrandAuthGuard)
export class BrandAthleteController {
  constructor(
    private readonly athleteProfileService: AthleteProfileService,
    private readonly athleteDiscoverService: AthleteDiscoverService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List synced athletes for discovery" })
  @ApiListQuery({
    includeIsActive: false,
    searchDescription: "Search by athlete name or slug",
  })
  @ApiSuccessResponse("Synced athletes fetched successfully")
  async list(
    @Brand() brand: BrandRequestUser,
    @Query(new ZodValidationPipe(brandAthletesListQuerySchema))
    query: BrandAthletesListQuery,
  ) {
    const result = await this.athleteDiscoverService.listSynced(
      query,
      brand.id,
    );
    return {
      success: true,
      message: "Synced athletes fetched successfully",
      data: result,
    };
  }

  @Get(":id/profile")
  @ApiOperation({ summary: "Get athlete profile with HypeAuditor analytics" })
  @ApiSuccessResponse("Athlete profile fetched successfully")
  async getProfile(
    @Param(new ZodValidationPipe(athleteIdentifierParamSchema))
    params: { id: string },
  ) {
    const profile = await this.athleteProfileService.getProfile(params.id);
    if (!profile) {
      throw new AppError(404, "Athlete not found", "NOT_FOUND");
    }

    return {
      success: true,
      message: "Athlete profile fetched successfully",
      data: { profile },
    };
  }

  @Get(":id")
  @ApiOperation({
    summary: "Get athlete detail for brand frontend (discover profile)",
  })
  @ApiSuccessResponse("Athlete fetched")
  async getOne(
    @Brand() brand: BrandRequestUser,
    @Param(new ZodValidationPipe(athleteIdentifierParamSchema))
    params: { id: string },
    @Query(new ZodValidationPipe(brandAthleteDetailQuerySchema))
    query: BrandAthleteDetailQuery,
  ) {
    const athlete = await this.athleteProfileService.getBrandAthleteDetail(
      params.id,
      brand.id,
      query,
    );
    if (!athlete) {
      throw new AppError(404, "Athlete not found", "NOT_FOUND");
    }

    return {
      success: true,
      message: "Athlete fetched",
      data: {
        athlete,
      },
    };
  }
}
