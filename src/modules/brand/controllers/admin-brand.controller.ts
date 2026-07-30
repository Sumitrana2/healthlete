import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AdminAuthGuard } from "../../admin/guards/admin-auth.guard";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";
import { ApiListQuery } from "../../../common/decorators/api-list-query.decorator";
import { ApiZodBody } from "../../../common/decorators/api-zod-body.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { idParamSchema } from "../../../common/dto/pagination.dto";
import { AdminBrandService } from "../services/admin-brand.service";
import {
  adminBrandsListQuerySchema,
  updateBrandStatusSchema,
  type AdminBrandsListQuery,
  type UpdateBrandStatusInput,
} from "../dto/admin-brand.dto";

@ApiTags("Admin Brands")
@ApiBearerAuth("admin-access-token")
@ApiCookieAuth("admin_access_token")
@Controller("admin/brands")
@UseGuards(AdminAuthGuard)
export class AdminBrandController {
  constructor(private readonly adminBrandService: AdminBrandService) {}

  @Get()
  @ApiOperation({ summary: "List brands for admin" })
  @ApiListQuery({
    includeIsActive: true,
    searchDescription: "Search by brand name, email, slug, or company name",
  })
  @ApiSuccessResponse("Brands fetched successfully")
  async list(
    @Query(new ZodValidationPipe(adminBrandsListQuerySchema))
    query: AdminBrandsListQuery,
  ) {
    const result = await this.adminBrandService.list(query);
    return {
      success: true,
      message: "Brands fetched successfully",
      data: result,
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get brand by ID" })
  @ApiSuccessResponse("Brand fetched")
  async getOne(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
  ) {
    const brand = await this.adminBrandService.getById(params.id);
    return {
      success: true,
      message: "Brand fetched",
      data: { brand },
    };
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Enable or disable a brand" })
  @ApiZodBody(updateBrandStatusSchema, "UpdateBrandStatusBody")
  @ApiSuccessResponse("Brand status updated")
  async updateStatus(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateBrandStatusSchema))
    body: UpdateBrandStatusInput,
  ) {
    const result = await this.adminBrandService.updateStatus(params.id, body);
    return {
      success: true,
      message: `Brand ${body.isActive ? "enabled" : "disabled"} successfully`,
      data: { result },
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete brand" })
  @ApiSuccessResponse("Brand deleted successfully")
  async remove(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
  ) {
    await this.adminBrandService.remove(params.id);
    return {
      success: true,
      message: "Brand deleted successfully",
      data: null,
    };
  }
}
