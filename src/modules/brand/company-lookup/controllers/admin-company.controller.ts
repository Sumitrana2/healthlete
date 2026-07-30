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
import { AdminCompanyService } from "../services/admin-company.service";
import { ApiSuccessResponse } from "../../../../common/decorators/api-response.decorator";
import { ApiListQuery } from "../../../../common/decorators/api-list-query.decorator";
import { ApiZodBody } from "../../../../common/decorators/api-zod-body.decorator";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import { idParamSchema, listQuerySchema, ListQuery } from "../../../../common/dto/pagination.dto";
import { createCompanySchema, updateCompanySchema } from "../dto/company-lookup.dto";
import { AppError } from "../../../../common/exceptions/app.error";

@ApiTags("Admin Lookup Data")
@Controller("admin/lookup/company")
@UseGuards(AdminAuthGuard)
export class AdminCompanyController {
  constructor(private readonly adminCompanyService: AdminCompanyService) {}

  @Get()
  @ApiOperation({ summary: "Get all companies list" })
  @ApiListQuery({ includeIsActive: false, searchDescription: "Search by company name or website" })
  @ApiSuccessResponse("Companies fetched successfully")
  async list(@Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery) {
    const result = await this.adminCompanyService.list(query);
    return { success: true, message: "Companies fetched successfully", data: result };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get company by ID" })
  @ApiSuccessResponse("Company fetched successfully")
  async getOne(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const company = await this.adminCompanyService.getById(params.id);
    if (!company) throw new AppError(404, "Company not found", "NOT_FOUND");
    return { success: true, message: "Company fetched successfully", data: { company } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create company" })
  @ApiZodBody(createCompanySchema, "CreateCompanyBody")
  @ApiSuccessResponse("Company created")
  async create(
    @Body(new ZodValidationPipe(createCompanySchema))
    body: {
      name: string;
      website?: string;
      logoUrl?: string;
      description?: string;
      country?: string;
      industryId?: string;
      companySizeId?: string;
    }
  ) {
    const company = await this.adminCompanyService.create(body);
    return { success: true, message: "Company created successfully", data: { company } };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update company" })
  @ApiZodBody(updateCompanySchema, "UpdateCompanyBody")
  @ApiSuccessResponse("Company updated")
  async update(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateCompanySchema))
    body: {
      name?: string;
      website?: string | null;
      logoUrl?: string | null;
      description?: string | null;
      country?: string | null;
      industryId?: string | null;
      companySizeId?: string | null;
    }
  ) {
    const company = await this.adminCompanyService.update(params.id, body);
    return { success: true, message: "Company updated successfully", data: { company } };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete company" })
  @ApiSuccessResponse("Company deleted")
  async remove(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const company = await this.adminCompanyService.remove(params.id);
    return { success: true, message: "Company deleted successfully", data: { company } };
  }
}
