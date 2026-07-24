// core/credibility/credibility.service.ts


import { calculateInstagramCredibility } from "./instagram-credibility";
import { calculateYoutubeCredibility } from "./youtube-credibility";
import { calculateTwitterCredibility } from "./twitter-credibility";
import { CREDIBILITY_WEIGHTS } from "./credibility-weights.config";
import type { PlatformCredibilityResult } from "./credibility.types";

export function calculateCredibilityForPlatform(
    platform: string,
    rawData: any
  ): PlatformCredibilityResult | null {
    switch (platform) {
      case "instagram": {
        const result = calculateInstagramCredibility(rawData, CREDIBILITY_WEIGHTS.instagram);
        return { platform, score: result.score, breakdown: result.breakdown };
      }
      case "youtube": {
        const result = calculateYoutubeCredibility(rawData, CREDIBILITY_WEIGHTS.youtube);
        return { platform, score: result.score, breakdown: result.breakdown };
      }
      case "twitter": {
        const result = calculateTwitterCredibility(rawData, CREDIBILITY_WEIGHTS.twitter);
        return { platform, score: result.score, breakdown: result.breakdown };
      }
      default:
        return null;
    }
  }
  
  export function calculateOverallCredibility(
    platformResults: PlatformCredibilityResult[],
    platformWeights: Record<string, number>
  ): { overallScore: number; breakdown: PlatformCredibilityResult[] } {
    let weightedSum = 0;
    let totalWeight = 0;
  
    for (const result of platformResults) {
      const weight = platformWeights[result.platform] ?? 0;
      weightedSum += result.score * (weight / 100);
      totalWeight += weight;
    }
  
    const overallScore = totalWeight > 0 ? weightedSum : 0;
  
    return {
      overallScore: Math.round(overallScore * 100) / 100,
      breakdown: platformResults,
    };
  }