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
import { AdminChannelsService } from "../services/admin-channels.service";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";
import { ApiListQuery } from "../../../common/decorators/api-list-query.decorator";
import { ApiZodBody } from "../../../common/decorators/api-zod-body.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { idParamSchema, listQuerySchema, ListQuery } from "../../../common/dto/pagination.dto";
import { createNameLookupSchema, updateNameLookupSchema } from "../../../common/dto/name-lookup.dto";
import { AppError } from "../../../common/exceptions/app.error";

@ApiTags("Admin Lookup Data")
@Controller("admin/lookup/channels")
@UseGuards(AdminAuthGuard)
export class AdminChannelsController {
  constructor(private readonly adminChannelsService: AdminChannelsService) {}

  @Get()
  @ApiOperation({ summary: "Get all active channels" })
  @ApiListQuery()
  @ApiSuccessResponse("Channels fetched successfully")
  async list(@Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery) {
    const result = await this.adminChannelsService.list(query);
    return { success: true, message: "Channels fetched successfully", data: result };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get channel by ID" })
  @ApiSuccessResponse("Channel fetched successfully")
  async getOne(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const channel = await this.adminChannelsService.getById(params.id);
    if (!channel) throw new AppError(404, "Channel not found", "NOT_FOUND");
    return { success: true, message: "Channel fetched successfully", data: { channel } };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create channel" })
  @ApiZodBody(createNameLookupSchema, "CreateChannelBody")
  @ApiSuccessResponse("Channel created")
  async create(@Body(new ZodValidationPipe(createNameLookupSchema)) body: { name: string; isActive?: boolean }) {
    const channel = await this.adminChannelsService.create(body);
    return { success: true, message: "Channel created successfully", data: { channel } };
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update channel" })
  @ApiZodBody(updateNameLookupSchema, "UpdateChannelBody")
  @ApiSuccessResponse("Channel updated")
  async update(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(updateNameLookupSchema)) body: { name?: string; isActive?: boolean }
  ) {
    const channel = await this.adminChannelsService.update(params.id, body);
    return { success: true, message: "Channel updated successfully", data: { channel } };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete channel" })
  @ApiSuccessResponse("Channel deleted")
  async remove(@Param(new ZodValidationPipe(idParamSchema)) params: { id: string }) {
    const channel = await this.adminChannelsService.remove(params.id);
    return {
      success: true,
      message: "Preferred channel deleted successfully",
      data: channel,
    };
  }
}
