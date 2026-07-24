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
    bio: 40,
    hashtag: 25,
    caption: 20,
    videoTitle: 15,
  };
  
  function normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }
  
  // function countMatches(text: string, keywords: string[]): number {
  //   const normalized = normalizeText(text);
  //   return keywords.reduce((count, keyword) => {
  //     const regex = new RegExp(keyword.toLowerCase(), "g");
  //     const matches = normalized.match(regex);
  //     return count + (matches?.length ?? 0);
  //   }, 0);
  // }
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