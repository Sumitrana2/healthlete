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
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { MulterOptions } from "@nestjs/platform-express/multer/interfaces/multer-options.interface";
import { Request } from "express";
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { AdminAuthGuard } from "../../admin/guards/admin-auth.guard";
import { AdminAthleteService } from "../services/admin-athlete.service";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";
import { ApiListQuery } from "../../../common/decorators/api-list-query.decorator";
import { ApiZodBody } from "../../../common/decorators/api-zod-body.decorator";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import {
  idParamSchema,
  listQuerySchema,
  ListQuery,
} from "../../../common/dto/pagination.dto";
import {
  addPlatformsSchema,
  searchAthleteSchema,
  searchExistingAthleteSchema,
  syncAthleteDataSchema,
  syncPlatformSchema,
  updateManualAthleteFieldSchema,
  type SyncPlatformInput,
} from "../dto/admin-athlete.dto";
import { AppError } from "../../../common/exceptions/app.error";
import { athleteAvatarUploadOptions } from "../config/athlete-upload.config";
import { UploadService } from "../../../shared/storage/upload.service";
import { parseCreateAthleteFields } from "../utils/parse-create-athlete-fields.util";
import { parseUpdateAthleteFields } from "../utils/parse-update-athlete-fields.util";
import { AiService } from "../../ai/ai.service";
import { z } from "zod";

const platformLinkParamSchema = z.object({
  id: z.string().uuid("Invalid ID"),
  linkId: z.string().uuid("Invalid platform link ID"),
});

function isSyncPlatformBody(body: Record<string, unknown>): boolean {
  return body.provider === "hyperauditor" && typeof body.platform === "object";
}

@ApiTags("Admin Athletes")
@ApiBearerAuth("admin-access-token")
@ApiCookieAuth("admin_access_token")
@Controller("admin/athletes")
@UseGuards(AdminAuthGuard)
export class AdminAthleteController {
  constructor(
    private readonly adminAthleteService: AdminAthleteService,
    private readonly uploadService: UploadService,
    private readonly aiService: AiService,
  ) {}

  @Get("search")
  @ApiOperation({ summary: "Search athletes via HypeAuditor" })
  @ApiQuery({ name: "query", required: false, type: String, example: "virat" })
  @ApiQuery({ name: "search", required: false, type: String, example: "virat" })
  @ApiQuery({ name: "st", required: false, type: String })
  @ApiQuery({ name: "exclSt", required: false, type: String })
  @ApiSuccessResponse("Athletes search results")
  async search(
    @Query(new ZodValidationPipe(searchAthleteSchema))
    query: {
      search: string;
      st?: string;
      exclSt?: string;
    },
  ) {
    const results = await this.adminAthleteService.search(
      query.search,
      query.st,
      query.exclSt,
    );
    return {
      success: true,
      message: "Athletes search completed",
      data: { items: results, list: results },
    };
  }

  @Get("search-existing")
  @ApiOperation({ summary: "Search existing athletes in the database by name" })
  @ApiQuery({ name: "name", required: true, type: String })
  @ApiSuccessResponse("Existing athletes search results")
  async searchExisting(
    @Query(new ZodValidationPipe(searchExistingAthleteSchema))
    query: { name: string },
  ) {
    const results = await this.adminAthleteService.searchExisting(query.name);
    return {
      success: true,
      message: "Existing athletes search completed",
      data: { items: results, results },
    };
  }

  @Get()
  @ApiOperation({ summary: "List athletes in database" })
  @ApiListQuery({
    includeIsActive: false,
    searchDescription:
      "Search by name, slug, country, tags, health conditions, or platform username",
  })
  @ApiSuccessResponse("Athletes fetched")
  async list(@Query(new ZodValidationPipe(listQuerySchema)) query: ListQuery) {
    const result = await this.adminAthleteService.list(query);
    return {
      success: true,
      message: "Athletes fetched",
      data: result,
    };
  }

  @Get("openai/test")
  @ApiOperation({ summary: "Test OpenAI connection" })
  async testAi() {
    const result = await this.aiService.test();
    return {
      success: true,
      data: result,
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get athlete by ID" })
  @ApiSuccessResponse("Athlete fetched successfully")
  async getOne(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
  ) {
    const athlete = await this.adminAthleteService.getById(params.id);
    if (!athlete) throw new AppError(404, "Athlete not found", "NOT_FOUND");
    return {
      success: true,
      message: "Athlete fetched successfully",
      data: { athlete },
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      "Create athlete from HyperAuditor platform payload (admin) or manually",
  })
  @ApiZodBody(syncPlatformSchema, "SyncPlatformBody")
  @ApiSuccessResponse("Athlete created successfully")
  @UseInterceptors(
    FileInterceptor("image", athleteAvatarUploadOptions as MulterOptions),
  )
  async create(
    @Req() req: Request,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    if (isSyncPlatformBody(body)) {
      const parsed = syncPlatformSchema.parse(body) as SyncPlatformInput;
      const result =
        await this.adminAthleteService.createFromSyncPlatform(parsed);
      const confirmation =
        "requiresConfirmation" in result && result.requiresConfirmation;
      const alreadyExists =
        "alreadyExists" in result && Boolean(result.alreadyExists);
      const redirected = "redirected" in result && Boolean(result.redirected);

      return {
        success: true,
        message: confirmation
          ? "Similar athlete found. Confirm to create new or add to existing."
          : alreadyExists
            ? "Selected platforms are already linked to an existing athlete."
            : redirected
              ? "Platform already exists on another athlete."
              : "Athlete created successfully",
        data: confirmation
          ? {
              requiresConfirmation: true,
              similarAthletes:
                "similarAthletes" in result ? result.similarAthletes : [],
              athlete: "athlete" in result ? result.athlete : null,
            }
          : "athlete" in result && result.athlete
            ? {
                requiresConfirmation: false,
                similarAthletes: [],
                athlete: result.athlete,
              }
            : result,
      };
    }

    const isMultipart = (req.headers["content-type"] ?? "").includes(
      "multipart/form-data",
    );
    const fields = parseCreateAthleteFields(body);
    const result = await this.adminAthleteService.createManual(
      fields,
      isMultipart ? file : undefined,
    );

    return {
      success: true,
      message: "Athlete created successfully",
      data: result,
    };
  }

  @Post("avatar")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Upload athlete avatar image" })
  @ApiSuccessResponse("Avatar uploaded successfully")
  @UseInterceptors(
    FileInterceptor("image", athleteAvatarUploadOptions as MulterOptions),
  )
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new AppError(400, "Image file is required", "VALIDATION_ERROR");
    }

    const upload = this.uploadService.buildFileResult(file, "athletes");
    return {
      success: true,
      message: "Avatar uploaded successfully",
      data: upload,
    };
  }

  @Post("from-search")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create athlete from HypeAuditor search" })
  @ApiZodBody(addPlatformsSchema, "CreateAthleteFromSearchBody")
  @ApiSuccessResponse("Athlete created successfully")
  async createFromSearch(
    @Body(new ZodValidationPipe(addPlatformsSchema))
    body: Parameters<AdminAthleteService["createFromSearch"]>[0],
  ) {
    const result = await this.adminAthleteService.createFromSearch(body);
    const confirmation =
      "requiresConfirmation" in result && result.requiresConfirmation;
    const alreadyExists =
      "alreadyExists" in result && Boolean(result.alreadyExists);
    const redirected = "redirected" in result && Boolean(result.redirected);

    return {
      success: true,
      message: confirmation
        ? "Similar athlete found. Confirm to create new or add to existing."
        : alreadyExists
          ? "Selected platforms are already linked to an existing athlete."
          : redirected
            ? "Platform already exists on another athlete."
            : "Athlete created successfully",
      data: confirmation
        ? {
            requiresConfirmation: true,
            similarAthletes:
              "similarAthletes" in result ? result.similarAthletes : [],
            athlete: "athlete" in result ? result.athlete : null,
          }
        : "athlete" in result && result.athlete
          ? {
              requiresConfirmation: false,
              similarAthletes: [],
              athlete: result.athlete,
            }
          : result,
    };
  }

  @Post("backfill-creator-raw")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Backfill hypeauditor_creator_raw for athletes missing creator raw data",
  })
  @ApiSuccessResponse("Creator raw backfill completed")
  async backfillCreatorRaw() {
    const result = await this.adminAthleteService.backfillMissingCreatorRaw();
    return {
      success: true,
      message: "Creator raw backfill completed",
      data: result,
    };
  }

  @Post(":id/platforms")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add platforms to an existing athlete" })
  @ApiZodBody(syncPlatformSchema, "SyncPlatformBody")
  @ApiSuccessResponse("Platform added successfully")
  async addPlatforms(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @Body() body: Record<string, unknown>,
  ) {
    const result = isSyncPlatformBody(body)
      ? await this.adminAthleteService.addSyncPlatformToAthlete(
          params.id,
          syncPlatformSchema.parse(body) as SyncPlatformInput,
        )
      : await this.adminAthleteService.addPlatformsToAthlete(
          params.id,
          addPlatformsSchema.parse(body),
        );

    return {
      success: true,
      message:
        "alreadyExists" in result && result.alreadyExists
          ? "Selected platforms are already linked to this athlete."
          : "redirected" in result && result.redirected
            ? "Platform already exists on another athlete."
            : "Platform added successfully",
      data: {
        result: "athlete" in result ? result.athlete : result,
      },
    };
  }

  @Delete(":id/platforms/:linkId")
  @ApiOperation({ summary: "Remove a platform link from an athlete" })
  @ApiSuccessResponse("Platform removed successfully")
  async removePlatform(
    @Param(new ZodValidationPipe(platformLinkParamSchema))
    params: { id: string; linkId: string },
  ) {
    const result = await this.adminAthleteService.removePlatform(
      params.id,
      params.linkId,
    );
    return {
      success: true,
      message: "Platform removed successfully",
      data: result,
    };
  }

  @Post(":id/sync-data")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Sync athlete platform data from HypeAuditor (admin frontend)",
  })
  @ApiZodBody(syncAthleteDataSchema, "SyncAthleteDataBody")
  @ApiSuccessResponse("Athlete data sync completed successfully")
  async syncData(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @Body(new ZodValidationPipe(syncAthleteDataSchema.optional().default({})))
    _body: { provider?: "hyperauditor" },
    @Res({ passthrough: true }) res: import("express").Response,
  ) {
    const result = await this.adminAthleteService.syncAthlete(params.id);
    const results = result.results ?? [];
    const hasFailed = results.some(
      (item: { status?: string }) => item.status === "failed",
    );

    if (hasFailed) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR);
    }

    return {
      success: !hasFailed,
      message: hasFailed
        ? "Sync completed with errors"
        : "Athlete data sync completed successfully",
      data: { results },
    };
  }

  @Post(":id/sync")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Sync athlete platform data from HypeAuditor" })
  @ApiSuccessResponse("Athlete data sync completed successfully")
  async sync(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @Res({ passthrough: true }) res: import("express").Response,
  ) {
    return this.syncData(params, { provider: "hyperauditor" }, res);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update athlete details" })
  @ApiZodBody(updateManualAthleteFieldSchema, "UpdateManualAthleteBody")
  @ApiSuccessResponse("Athlete updated successfully")
  @UseInterceptors(
    FileInterceptor("image", athleteAvatarUploadOptions as MulterOptions),
  )
  async update(
    @Req() req: Request,
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    const isMultipart = (req.headers["content-type"] ?? "").includes(
      "multipart/form-data",
    );
    const fields = parseUpdateAthleteFields(body);
    const result = await this.adminAthleteService.updateManual(
      params.id,
      fields,
      isMultipart ? file : undefined,
    );

    if (!result) {
      throw new AppError(404, "Athlete not found", "NOT_FOUND");
    }

    return {
      success: true,
      message: "Athlete updated successfully",
      data: result,
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete athlete" })
  @ApiSuccessResponse("Athlete deleted successfully")
  async remove(
    @Param(new ZodValidationPipe(idParamSchema)) params: { id: string },
  ) {
    const athlete = await this.adminAthleteService.remove(params.id);
    if (!athlete) throw new AppError(404, "Athlete not found", "NOT_FOUND");
    return {
      success: true,
      message: "Athlete deleted successfully",
      data: { athlete },
    };
  }
}
