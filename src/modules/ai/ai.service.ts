import { Injectable, Logger } from "@nestjs/common";
import { OpenAiService } from "../../integrations/openai/openai.service";
import {
  AiClient,
  type AIEnrichmentInput,
  type AIEnrichmentResult,
} from "./services/ai-client.service";
import { KeywordGeneratorAi } from "./services/keyword-generator.service";

export type AthleteEnrichmentResult = AIEnrichmentResult & {
  summary: string | null;
  tags: string[];
  campaignCategories: string[];
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly openAiService: OpenAiService,
    private readonly aiClient: AiClient,
    private readonly keywordGeneratorAi: KeywordGeneratorAi,
  ) {}

  /** Node-parity: ai.client.ts enrichAthleteData */
  enrichAthleteData(input: AIEnrichmentInput): Promise<AIEnrichmentResult> {
    return this.aiClient.enrichAthleteData(input);
  }

  /** Node-parity: keyword-generator.ai.ts */
  generateHealthConditionKeywords(conditionName: string) {
    return this.keywordGeneratorAi.generateHealthConditionKeywords(
      conditionName,
    );
  }

  async generateAthleteProfile(athlete: unknown): Promise<AthleteEnrichmentResult> {
    try {
      const record =
        typeof athlete === "object" && athlete !== null
          ? (athlete as {
              fullName?: unknown;
              platformLinks?: Array<{ username?: string | null }>;
            })
          : {};

      const fullName = String(record.fullName ?? "").trim() || "Unknown";
      const usernames = Array.isArray(record.platformLinks)
        ? record.platformLinks
            .map((link) => link.username)
            .filter((username): username is string => Boolean(username))
        : [];

      const result = await this.aiClient.enrichAthleteData({
        fullName,
        usernames,
      });

      return {
        ...result,
        summary: result.description,
        tags: result.categories,
        campaignCategories: result.categories,
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async test() {
    return this.openAiService.createTextResponse("Say Hello from GPT-5.5");
  }
}
