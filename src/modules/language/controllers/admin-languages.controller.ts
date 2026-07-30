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
import { AdminLanguagesService } from "../services/admin-languages.service";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";
import { ApiListQuery } from "../../../common/decorators/api-list-query.decorator";
import { ApiZodBody } from "../../../common/decorators/api-zod-body.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { idParamSchema, listQuerySchema, ListQuery } from "../../../common/dto/pagination.dto";
import { createLanguageSchema, updateLanguageSchema } from "../dto/admin-languages.dto";
import { AppError } from "../../../common/exceptions/app.error";

@ApiTags("Admin Lookup Data")
@Controller("admin/lookup/languages")
@UseGuards(AdminAuthGuard)
export class AdminLanguagesController {
  constructor(private readonly adminLanguagesService: AdminLanguagesService) {}

  @Get()
  @ApiOperation({ summary: "Get all active languages" })
  @ApiListQuery()
  @ApiSuccessResponse("Languages fetched successfully")
  async list(@Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery) {
    const result = await this.adminLanguagesService.list(query);
    return { success: true, message: "Languages fetched successfully", data: result };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get language by ID" })
  @ApiSuccessResponse("Language fetched successfully")
  async getOne(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const language = await this.adminLanguagesService.getById(params.id);
    if (!language) throw new AppError(404, "Language not found", "NOT_FOUND");
    return { success: true, message: "Language fetched successfully", data: { language } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create language" })
  @ApiZodBody(createLanguageSchema, "CreateLanguageBody")
  @ApiSuccessResponse("Language created")
  async create(
    @Body(new ZodValidationPipe(createLanguageSchema))
    body: { name: string; code: string; isActive?: boolean }
  ) {
    const language = await this.adminLanguagesService.create(body);
    return { success: true, message: "Language created successfully", data: { language } };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update language" })
  @ApiZodBody(updateLanguageSchema, "UpdateLanguageBody")
  @ApiSuccessResponse("Language updated")
  async update(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateLanguageSchema))
    body: { name?: string; code?: string; isActive?: boolean }
  ) {
    const language = await this.adminLanguagesService.update(params.id, body);
    return { success: true, message: "Language updated successfully", data: { language } };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete language" })
  @ApiSuccessResponse("Language deleted")
  async remove(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const language = await this.adminLanguagesService.remove(params.id);
    return {
      success: true,
      message: "Language deleted successfully",
      data: language,
    };
  }
}
