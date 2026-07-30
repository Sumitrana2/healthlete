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
import { AdminHealthConditionService } from "../services/admin-health.condition.service";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";
import { ApiListQuery } from "../../../common/decorators/api-list-query.decorator";
import { ApiZodBody } from "../../../common/decorators/api-zod-body.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { idParamSchema, listQuerySchema, ListQuery } from "../../../common/dto/pagination.dto";
import { createNameLookupSchema, updateNameLookupSchema } from "../../../common/dto/name-lookup.dto";
import { AppError } from "../../../common/exceptions/app.error";

@ApiTags("Admin Lookup Data")
@Controller("admin/lookup/health-conditions")
@UseGuards(AdminAuthGuard)
export class AdminHealthConditionController {
  constructor(private readonly adminHealthConditionService: AdminHealthConditionService) {}

  @Get()
  @ApiOperation({ summary: "Get all active health conditions" })
  @ApiListQuery()
  @ApiSuccessResponse("Health conditions fetched successfully")
  async list(@Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery) {
    const result = await this.adminHealthConditionService.list(query);
    return { success: true, message: "Health conditions fetched successfully", data: result };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get health condition by ID" })
  @ApiSuccessResponse("Health condition fetched successfully")
  async getOne(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const healthCondition = await this.adminHealthConditionService.getById(params.id);
    if (!healthCondition) throw new AppError(404, "Health condition not found", "NOT_FOUND");
    return { success: true, message: "Health condition fetched successfully", data: { healthCondition } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create health condition" })
  @ApiZodBody(createNameLookupSchema, "CreateHealthConditionBody")
  @ApiSuccessResponse("Health condition created")
  async create(@Body(new ZodValidationPipe(createNameLookupSchema)) body: { name: string; isActive?: boolean }) {
    const healthCondition = await this.adminHealthConditionService.create(body);
    return { success: true, message: "Health condition created successfully", data: { healthCondition } };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update health condition" })
  @ApiZodBody(updateNameLookupSchema, "UpdateHealthConditionBody")
  @ApiSuccessResponse("Health condition updated")
  async update(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateNameLookupSchema)) body: { name?: string; isActive?: boolean }
  ) {
    const healthCondition = await this.adminHealthConditionService.update(params.id, body);
    return { success: true, message: "Health condition updated successfully", data: { healthCondition } };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete health condition" })
  @ApiSuccessResponse("Health condition deleted")
  async remove(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const healthCondition = await this.adminHealthConditionService.remove(params.id);
    return {
      success: true,
      message: "Health condition deleted successfully",
      data: healthCondition,
    };
  }
}
