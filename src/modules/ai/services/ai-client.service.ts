import { Injectable } from "@nestjs/common";
import { AppError } from "../../../common/exceptions/app.error";
import { OpenAiService } from "../../../integrations/openai/openai.service";
import { athleteProfilePrompt } from "../prompts/athlete-profile.prompt";
import type { PersonalHealthConnection } from "../../scoring/resonance/resonance-calculator";

export type AIEnrichmentInput = {
  fullName: string;
  usernames: string[];
};

export type AIEnrichmentResult = {
  country: string | null;
  countryName: string | null;
  description: string | null;
  languages: string[];
  categories: string[];
  gender: string | null;
  healthConditions: string[];
  personalHealthConnections: PersonalHealthConnection[];
};

/**
 * Port of Node `modules/core/ai/ai.client.ts`.
 * Generates athlete description + healthConditions + personalHealthConnections during sync.
 */
@Injectable()
export class AiClient {
  constructor(private readonly openAiService: OpenAiService) {}

  async enrichAthleteData(
    input: AIEnrichmentInput,
  ): Promise<AIEnrichmentResult> {
    try {
      const raw = await this.openAiService.createJsonChatCompletion(
        "You are a data enrichment assistant. Based on public social media bio information, infer missing athlete profile attributes. Only return information you can reasonably infer from the given context. Never fabricate specific facts — use null or empty array instead when unsure.",
        this.buildPrompt(input),
        "gpt-4.1-2025-04-14",
      );

      const parsed = JSON.parse(raw) as Partial<AIEnrichmentResult>;
      return {
        country: parsed.country ?? null,
        countryName: parsed.countryName ?? null,
        description: parsed.description ?? null,
        languages: parsed.languages ?? [],
        categories: parsed.categories ?? [],
        gender: parsed.gender ?? null,
        healthConditions: parsed.healthConditions ?? [],
        personalHealthConnections: parsed.personalHealthConnections ?? [],
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof SyntaxError) {
        throw new AppError(502, "Failed to parse OpenAI response", "AI_PARSE_ERROR");
      }
      const message =
        error instanceof Error ? error.message : "OpenAI API failed";
      throw new AppError(502, message, "AI_ENRICHMENT_FAILED");
    }
  }

  private buildPrompt(input: AIEnrichmentInput): string {
    return athleteProfilePrompt(input);
  }
}
