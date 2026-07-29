import { PersonalHealthConnection, PersonalHealthScoreResult } from "../athlete/athlete.types";
import { ExtractedText } from "./text-extractor";

export interface ResonanceResult {
    resonanceConditionId: string;
    condition: string;
    score: number;
    matchedIn: {
      bio: boolean;
      hashtagCount: number;
      captionCount: number;
      videoTitleCount: number;
    };
  }
  
  interface ConditionForScoring {
    id: string;
    condition: string;
    keywords: string[];
    hashtags: string[];
  }
  
  const WEIGHTS = {
    bio: 30,
    hashtag: 20,
    caption: 15,
    videoTitle: 5,
  };
  
  function normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }
  
  function countMatches(text: string, keywords: string[]): number {
    const normalized = normalizeText(text);
  
    return keywords.reduce((count, keyword) => {
      const words = keyword
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
  
      const matched = words.some(word => normalized.includes(word));
  
      return count + (matched ? 1 : 0);
    }, 0);
  }
  
  export function calculateResonanceForCondition(
    config: ConditionForScoring,
    extractedTexts: ExtractedText[]
  ): ResonanceResult {
    let bioMatch = false;
    let hashtagCount = 0;
    let captionCount = 0;
    let videoTitleCount = 0;
  
    for (const extracted of extractedTexts) {
      if (countMatches(extracted.bio, config.keywords) > 0) {
        bioMatch = true;
      }
  
      const normalizedHashtags = extracted.hashtags.map((h) => normalizeText(h));
      hashtagCount += normalizedHashtags.filter((h) =>
        config.hashtags.some((kh) => h.includes(kh.toLowerCase()))
      ).length;
  
      for (const caption of extracted.captions) {
        captionCount += countMatches(caption, config.keywords);
      }
  
      for (const title of extracted.videoTitles) {
        videoTitleCount += countMatches(title, config.keywords);
      }
    }
  
    let rawScore = 0;
    if (bioMatch) rawScore += WEIGHTS.bio;
    rawScore += Math.min(hashtagCount * 5, WEIGHTS.hashtag);
    rawScore += Math.min(captionCount * 4, WEIGHTS.caption);
    rawScore += Math.min(videoTitleCount * 5, WEIGHTS.videoTitle);
  
    const score = Math.min(Math.round(rawScore), 100);
  
    return {
      resonanceConditionId: config.id,
      condition: config.condition,
      score,
      matchedIn: { bio: bioMatch, hashtagCount, captionCount, videoTitleCount },
    };
  }


  export function calculateResonancePersonalHealthCondition(
    resonanceConditions: { condition: string }[],
    personalHealthConnections: PersonalHealthConnection[]
  ): PersonalHealthScoreResult {
  
    const matched: PersonalHealthScoreResult["matched"] = [];
    const unmatched: string[] = [];
  
    for (const resonance of resonanceConditions) {
  
      let found = false;
  
      for (const personal of personalHealthConnections) {
  
        if (hasTokenMatch(personal.condition, resonance.condition)) {
  
          matched.push({
            condition: resonance.condition,
            matchedBy: "condition",
            relationship: personal.relationship
          });
  
          found = true;
          break;
        }
  
        if (hasTokenMatch(personal.reason, resonance.condition)) {
  
          matched.push({
            condition: resonance.condition,
            matchedBy: "reason",
            relationship: personal.relationship
          });
  
          found = true;
          break;
        }
      }
  
      if (!found) {
        unmatched.push(resonance.condition);
      }
    }
  
    const percentage =
      resonanceConditions.length === 0
        ? 0
        : matched.length / resonanceConditions.length;
  
    const score = Math.round(percentage * 30);
  
    return {
      score,
      matched,
      unmatched
    };
  }
  function normalize(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
  
  function hasTokenMatch(a: string, b: string): boolean {
    const aWords = new Set(normalize(a).split(" "));
    const bWords = normalize(b).split(" ");
  
    return bWords.some(word => word.length > 2 && aWords.has(word));
  }