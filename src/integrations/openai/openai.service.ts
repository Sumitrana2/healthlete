import { Injectable } from "@nestjs/common";
import OpenAI from "openai";
import { env } from "../../config/env";

@Injectable()
export class OpenAiService {
  private readonly client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  getClient() {
    return this.client;
  }

  async createTextResponse(input: string, model = "gpt-5.5") {
    const response = await this.client.responses.create({
      model,
      input,
    });
    return response.output_text;
  }

  /**
   * Chat Completions JSON mode — matches Node sync enrichment behavior.
   * Tries primary model, then cheaper fallbacks on quota/model errors.
   */
  async createJsonChatCompletion(
    system: string,
    user: string,
    model = "gpt-4.1-2025-04-14",
    temperature?: number,
  ) {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Prefer Node's model; fall back when that model is quota-limited.
    const models = [
      model,
      "gpt-4.1-2025-04-14",
      "gpt-4o-mini",
      "gpt-4o",
    ].filter((value, index, arr) => arr.indexOf(value) === index);

    let lastError: unknown;

    for (const candidate of models) {
      try {
        const response = await this.client.chat.completions.create({
          model: candidate,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
          ...(temperature !== undefined ? { temperature } : {}),
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("OpenAI returned empty response");
        }

        return content;
      } catch (error) {
        lastError = error;
        const message =
          error instanceof Error ? error.message : String(error);
        const retryable =
          message.includes("429") ||
          message.includes("quota") ||
          message.includes("model_not_found") ||
          message.includes("does not exist") ||
          message.includes("insufficient_quota");

        if (!retryable || candidate === models[models.length - 1]) {
          break;
        }
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(String(lastError ?? "OpenAI API failed"));
  }
}
