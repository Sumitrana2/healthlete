import { Injectable } from "@nestjs/common";
import { AppError } from "../../../common/exceptions/app.error";
import { OpenAiService } from "../../../integrations/openai/openai.service";

export type KeywordGenerationResult = {
  keywords: string[];
  hashtags: string[];
};

/**
 * Port of Node `modules/core/ai/keyword-generator.ai.ts`.
 * Generates keyword/hashtag dictionaries for resonance matching.
 */
@Injectable()
export class KeywordGeneratorAi {
  constructor(private readonly openAiService: OpenAiService) {}

  async generateHealthConditionKeywords(
    conditionName: string,
  ): Promise<KeywordGenerationResult> {
    try {
      const raw = await this.openAiService.createJsonChatCompletion(
        "You generate keyword and hashtag dictionaries used to detect mentions of a health condition in social media bios, captions, and hashtags. Be comprehensive — include medical terms, common variations, and colloquial terms people actually use online.",
        `
Health Condition: "${conditionName}"

Return a JSON object with:
{
  "keywords": ["array of 8-15 words/phrases people would naturally use when discussing this condition in a bio, post, or caption — include medical terms, common variations, and related terms. All lowercase."],
  "hashtags": ["array of 5-10 hashtag variants (without #) people commonly use for this condition or its awareness/advocacy on social media. Lowercase, no spaces."]
}
        `.trim(),
        "gpt-4.1-2025-04-14",
        0.3,
      );

      const parsed = JSON.parse(raw) as KeywordGenerationResult;
      return {
        keywords: parsed.keywords ?? [],
        hashtags: parsed.hashtags ?? [],
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof SyntaxError) {
        throw new AppError(
          502,
          "Failed to parse OpenAI keyword generation response",
          "AI_PARSE_ERROR",
        );
      }
      const message =
        error instanceof Error ? error.message : "OpenAI API failed";
      throw new AppError(502, message, "AI_KEYWORD_GENERATION_FAILED");
    }
  }
}
