import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { AiService } from "./ai.service";
import { ApiSuccessResponse } from "../../common/decorators/api-response.decorator";

@ApiTags("AI")
@Controller("ai")
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get("health")
  @ApiOperation({ summary: "Test AI provider connectivity" })
  @ApiSuccessResponse("AI provider reachable")
  async health() {
    const result = await this.aiService.test();
    return {
      success: true,
      message: "AI provider reachable",
      data: { result },
    };
  }
}
