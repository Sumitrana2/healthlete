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
import { AdminAuthGuard } from "../../admin/guards/admin-auth.guard";
import { AdminIndustriesService } from "../services/admin-industries.service";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";
import { ApiListQuery } from "../../../common/decorators/api-list-query.decorator";
import { ApiZodBody } from "../../../common/decorators/api-zod-body.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { idParamSchema, listQuerySchema, ListQuery } from "../../../common/dto/pagination.dto";
import { createNameLookupSchema, updateNameLookupSchema } from "../../../common/dto/name-lookup.dto";
import { AppError } from "../../../common/exceptions/app.error";

@ApiTags("Admin Lookup Data")
@Controller("admin/lookup/industries")
@UseGuards(AdminAuthGuard)
export class AdminIndustriesController {
  constructor(private readonly adminIndustriesService: AdminIndustriesService) {}

  @Get()
  @ApiOperation({ summary: "Get all active industries" })
  @ApiListQuery()
  @ApiSuccessResponse("Industries fetched successfully")
  async list(@Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery) {
    const result = await this.adminIndustriesService.list(query);
    return { success: true, message: "Industries fetched successfully", data: result };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get industry by ID" })
  @ApiSuccessResponse("Industry fetched successfully")
  async getOne(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const industry = await this.adminIndustriesService.getById(params.id);
    if (!industry) throw new AppError(404, "Industry not found", "NOT_FOUND");
    return { success: true, message: "Industry fetched successfully", data: { industry } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create industry" })
  @ApiZodBody(createNameLookupSchema, "CreateIndustryBody")
  @ApiSuccessResponse("Industry created")
  async create(@Body(new ZodValidationPipe(createNameLookupSchema)) body: { name: string; isActive?: boolean }) {
    const industry = await this.adminIndustriesService.create(body);
    return { success: true, message: "Industry created successfully", data: { industry } };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update industry" })
  @ApiZodBody(updateNameLookupSchema, "UpdateIndustryBody")
  @ApiSuccessResponse("Industry updated")
  async update(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateNameLookupSchema)) body: { name?: string; isActive?: boolean }
  ) {
    const industry = await this.adminIndustriesService.update(params.id, body);
    return { success: true, message: "Industry updated successfully", data: { industry } };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete industry" })
  @ApiSuccessResponse("Industry deleted")
  async remove(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const industry = await this.adminIndustriesService.remove(params.id);
    return {
      success: true,
      message: "Industry deleted successfully",
      data: industry,
    };
  }
}
