import { Controller, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { TaxonomyService } from "../services/taxonomy.service";
import { taxonomyQuerySchema, type TaxonomyQuery } from "../dto/taxonomy.dto";
import { ZodValidationPipe } from "../../../../common/pipes/zod-validation.pipe";
import { ApiSuccessResponse } from "../../../../common/decorators/api-response.decorator";

@ApiTags("Taxonomy")
@Controller("common/taxonomy")
export class TaxonomyController {
  constructor(private readonly taxonomyService: TaxonomyService) {}

  @Get()
  @ApiOperation({ summary: "Get taxonomy by platform and kind" })
  @ApiSuccessResponse("Category list")
  async list(@Query(new ZodValidationPipe(taxonomyQuerySchema)) query: TaxonomyQuery) {
    const data = await this.taxonomyService.getTaxonomy(query);
    return { success: true, message: "Category List", data: { list: data } };
  }
}
