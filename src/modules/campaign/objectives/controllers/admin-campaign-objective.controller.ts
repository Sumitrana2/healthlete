import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AdminAuthGuard } from "../../../admin/guards/admin-auth.guard";
import { AdminCampaignObjectiveService } from "../services/admin-campaign.objective.service";
import { ApiSuccessResponse } from "../../../../common/decorators/api-response.decorator";
import { ApiListQuery } from "../../../../common/decorators/api-list-query.decorator";
import { ApiZodBody } from "../../../../common/decorators/api-zod-body.decorator";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import { idParamSchema, listQuerySchema, ListQuery } from "../../../../common/dto/pagination.dto";
import { createNameLookupSchema, updateNameLookupSchema } from "../../../../common/dto/name-lookup.dto";
import { AppError } from "../../../../common/exceptions/app.error";

@ApiTags("Admin Lookup Data")
@Controller("admin/lookup/campaign-objectives")
@UseGuards(AdminAuthGuard)
export class AdminCampaignObjectiveController {
  constructor(private readonly adminCampaignObjectiveService: AdminCampaignObjectiveService) {}

  @Get()
  @ApiOperation({ summary: "Get all active campaign objectives" })
  @ApiListQuery()
  @ApiSuccessResponse("Campaign objectives fetched successfully")
  async list(@Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery) {
    const result = await this.adminCampaignObjectiveService.list(query);
    return { success: true, message: "Campaign objectives fetched successfully", data: result };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get campaign objective by ID" })
  @ApiSuccessResponse("Campaign objective fetched successfully")
  async getOne(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const campaignObjective = await this.adminCampaignObjectiveService.getById(params.id);
    if (!campaignObjective) throw new AppError(404, "Campaign objective not found", "NOT_FOUND");
    return { success: true, message: "Campaign objective fetched successfully", data: { campaignObjective } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create campaign objective" })
  @ApiZodBody(createNameLookupSchema, "CreateCampaignObjectiveBody")
  @ApiSuccessResponse("Campaign objective created")
  async create(@Body(new ZodValidationPipe(createNameLookupSchema)) body: { name: string; isActive?: boolean }) {
    const campaignObjective = await this.adminCampaignObjectiveService.create(body);
    return { success: true, message: "Campaign objective created successfully", data: { campaignObjective } };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update campaign objective" })
  @ApiZodBody(updateNameLookupSchema, "UpdateCampaignObjectiveBody")
  @ApiSuccessResponse("Campaign objective updated")
  async update(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateNameLookupSchema)) body: { name?: string; isActive?: boolean }
  ) {
    const campaignObjective = await this.adminCampaignObjectiveService.update(params.id, body);
    return { success: true, message: "Campaign objective updated successfully", data: { campaignObjective } };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete campaign objective" })
  @ApiSuccessResponse("Campaign objective deleted")
  async remove(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const campaignObjective = await this.adminCampaignObjectiveService.remove(params.id);
    return {
      success: true,
      message: "Campaign objective deleted successfully",
      data: campaignObjective,
    };
  }
}
