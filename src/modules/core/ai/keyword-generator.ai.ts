import { AppError } from "../../../middleware/errorHandler";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

export interface KeywordGenerationResult {
  keywords: string[];
  hashtags: string[];
}

export async function generateHealthConditionKeywords(
  conditionName: string
): Promise<KeywordGenerationResult> {
  const response = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4.1-2025-04-14",
      messages: [
        {
          role: "system",
          content:
            "You generate keyword and hashtag dictionaries used to detect mentions of a health condition in social media bios, captions, and hashtags. Be comprehensive — include medical terms, common variations, and colloquial terms people actually use online.",
        },
        {
          role: "user",
          content: `
Health Condition: "${conditionName}"

Return a JSON object with:
{
  "keywords": ["array of 8-15 words/phrases people would naturally use when discussing this condition in a bio, post, or caption — include medical terms, common variations, and related terms. All lowercase."],
  "hashtags": ["array of 5-10 hashtag variants (without #) people commonly use for this condition or its awareness/advocacy on social media. Lowercase, no spaces."]
}
          `.trim(),
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new AppError(502, `OpenAI API failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices: { message: { content: string } }[];
  };

  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new AppError(502, "OpenAI returned empty response");

  try {
    const parsed = JSON.parse(raw) as KeywordGenerationResult;
    return {
      keywords: parsed.keywords ?? [],
      hashtags: parsed.hashtags ?? [],
    };
  } catch {
    throw new AppError(
      502,
      "Failed to parse OpenAI keyword generation response"
    );
  }
}
