import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db } from "../../../database/drizzle";
import {
  athleteResonanceScores,
  resonanceConditions,
} from "../../../database/drizzle/schema";
import { KeywordGeneratorAi } from "../../ai/services/keyword-generator.service";
import type { ResonanceResult } from "../resonance/resonance-calculator";

@Injectable()
export class ResonanceConditionService {
  constructor(private readonly keywordGeneratorAi: KeywordGeneratorAi) {}

  async findResonanceConditionByName(name: string) {
    const [row] = await db
      .select()
      .from(resonanceConditions)
      .where(eq(resonanceConditions.name, name))
      .limit(1);
    return row ?? null;
  }

  async insertResonanceCondition(data: {
    name: string;
    keywords: string[];
    hashtags: string[];
  }) {
    const [created] = await db
      .insert(resonanceConditions)
      .values({
        name: data.name,
        keywords: data.keywords,
        hashtags: data.hashtags,
        isActive: true,
      })
      .returning();
    return created;
  }

  async findOrCreateResonanceCondition(conditionName: string) {
    const normalized = conditionName.trim();
    if (!normalized) {
      throw new Error("Condition name is required");
    }

    const existing = await this.findResonanceConditionByName(normalized);
    if (existing) return existing;

    const keywordData =
      await this.keywordGeneratorAi.generateHealthConditionKeywords(normalized);

    const expandedKeywords = [
      ...keywordData.keywords,
      ...keywordData.keywords.flatMap((k) => k.split(/\s+/)),
    ];

    const uniqueKeywords = [
      ...new Set(expandedKeywords.map((k) => k.toLowerCase())),
    ];

    return this.insertResonanceCondition({
      name: normalized,
      keywords: uniqueKeywords,
      hashtags: keywordData.hashtags,
    });
  }

  async ensureConditionsForTags(tags: string[]) {
    const created = [];
    for (const tag of tags) {
      const normalized = tag.trim();
      if (!normalized) continue;
      created.push(await this.findOrCreateResonanceCondition(normalized));
    }
    return created;
  }

  async deleteAthleteResonanceScores(athleteId: string) {
    await db
      .delete(athleteResonanceScores)
      .where(eq(athleteResonanceScores.athleteId, athleteId));
  }

  async saveAthleteResonanceScores(
    athleteId: string,
    results: ResonanceResult[],
  ) {
    for (const result of results) {
      const [existing] = await db
        .select({ id: athleteResonanceScores.id })
        .from(athleteResonanceScores)
        .where(
          eq(athleteResonanceScores.athleteId, athleteId),
        );

      // Unique on (athleteId, resonanceConditionId) — use insert with conflict
      await db
        .insert(athleteResonanceScores)
        .values({
          athleteId,
          resonanceConditionId: result.resonanceConditionId,
          score: result.score,
          matchedIn: result.matchedIn,
          calculatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [
            athleteResonanceScores.athleteId,
            athleteResonanceScores.resonanceConditionId,
          ],
          set: {
            score: result.score,
            matchedIn: result.matchedIn,
            calculatedAt: new Date(),
          },
        });

      void existing;
    }
  }
}
