import { Module } from "@nestjs/common";
import { AiService } from "./ai.service";
import { AiController } from "./ai.controller";
import { AiClient } from "./services/ai-client.service";
import { KeywordGeneratorAi } from "./services/keyword-generator.service";
import { OpenAiModule } from "../../integrations/openai/openai.module";

@Module({
  imports: [OpenAiModule],
  controllers: [AiController],
  providers: [AiService, AiClient, KeywordGeneratorAi],
  exports: [AiService, AiClient, KeywordGeneratorAi],
})
export class AiModule {}
