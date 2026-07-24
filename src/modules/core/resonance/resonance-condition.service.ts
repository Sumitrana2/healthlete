// core/resonance/resonance-condition.service.ts
import { generateHealthConditionKeywords } from "../ai/keyword-generator.ai";
import * as repository from "./resonance-condition.repository";

export async function findOrCreateResonanceCondition(conditionName: string) {
  const normalized = conditionName.trim();

  const existing = await repository.findResonanceConditionByName(normalized);
  if (existing) return existing;

  const keywordData = await generateHealthConditionKeywords(normalized);
  const expandedKeywords = [
    ...keywordData.keywords,
    ...keywordData.keywords.flatMap(k => k.split(/\s+/))
  ];
  
  const uniqueKeywords = [...new Set(expandedKeywords.map(k => k.toLowerCase()))];
  return repository.insertResonanceCondition({
    name: normalized,
    keywords: uniqueKeywords,
    hashtags: keywordData.hashtags,
  });
}