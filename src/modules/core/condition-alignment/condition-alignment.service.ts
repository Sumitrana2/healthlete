// core/condition-alignment/condition-alignment.service.ts

import { calculateInstagramConditionAlignment } from "./instagram-condition-alignment";
import { calculateYoutubeConditionAlignment } from "./youtube-condition-alignment";
import { calculateTwitterConditionAlignment } from "./twitter-condition-alignment";
import { CONDITION_ALIGNMENT_WEIGHTS } from "./condition-alignment-weights.config";
import type {
  BrandProfile,
  PlatformConditionAlignmentResult,
} from "./condition-alignment.types";

// ── Per platform calculate karo ───────────────────────────────────────────────
export function calculateConditionAlignmentForPlatform(
  platform: string,
  rawData: any,
  brand: BrandProfile
): PlatformConditionAlignmentResult | null {
  switch (platform) {
    case "instagram": {
      const result = calculateInstagramConditionAlignment(
        rawData,
        brand,
        CONDITION_ALIGNMENT_WEIGHTS.instagram
      );
      return { platform, score: result.score, breakdown: result.breakdown };
    }

    case "youtube": {
      const result = calculateYoutubeConditionAlignment(
        rawData,
        brand,
        CONDITION_ALIGNMENT_WEIGHTS.youtube
      );
      return { platform, score: result.score, breakdown: result.breakdown };
    }

    case "twitter": {
      const result = calculateTwitterConditionAlignment(
        rawData,
        brand,
        CONDITION_ALIGNMENT_WEIGHTS.twitter
      );
      return { platform, score: result.score, breakdown: result.breakdown };
    }

    default:
      return null;
  }
}

// ── Sab platforms combine karo ────────────────────────────────────────────────
export function calculateOverallConditionAlignment(
  platformResults: PlatformConditionAlignmentResult[],
  platformWeights: Record<string, number>
): { overallScore: number; breakdown: PlatformConditionAlignmentResult[] } {

  // Twitter Condition Alignment mein contribute nahi karta
  // (sirf bio match hai — category aur interest data available nahi)
  // isliye Twitter ko filter out karo
  const eligibleResults = platformResults.filter(
    (r) => r.platform !== "twitter"
  );

  // Agar sirf Twitter hai toh — score 0
  if (!eligibleResults.length) {
    return {
      overallScore: 0,
      breakdown: platformResults,
    };
  }

  // Instagram + YouTube ke weights normalize karo
  // (Twitter ka weight exclude karke)
  const eligibleWeightSum = eligibleResults.reduce(
    (sum, r) => sum + (platformWeights[r.platform] ?? 0),
    0
  );

  let weightedSum = 0;
  for (const result of eligibleResults) {
    const rawWeight = platformWeights[result.platform] ?? 0;
    const normalizedWeight =
      eligibleWeightSum > 0 ? rawWeight / eligibleWeightSum : 0;
    weightedSum += result.score * normalizedWeight;
  }

  return {
    overallScore: Math.round(weightedSum * 100) / 100,
    breakdown: platformResults,   // sab platforms breakdown mein dikhao
  };
}