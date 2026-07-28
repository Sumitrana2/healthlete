// core/audience-trust/audience-trust.service.ts

import { calculateInstagramAudienceTrust } from "./instagram-audience-trust";
import { calculateYoutubeAudienceTrust } from "./youtube-audience-trust";
import { calculateTwitterAudienceTrust } from "./twitter-audience-trust";
import { AUDIENCE_TRUST_WEIGHTS } from "./audience-trust-weights.config";
import type { PlatformAudienceTrustResult } from "./audience-trust.types";

export function calculateAudienceTrustForPlatform(
  platform: string,
  rawData: any,
): PlatformAudienceTrustResult | null {
  switch (platform) {
    case "instagram": {
      const result = calculateInstagramAudienceTrust(
        rawData,
        AUDIENCE_TRUST_WEIGHTS.instagram
      );
      return { platform, score: result.score, breakdown: result.breakdown };
    }
    case "youtube": {
      const result = calculateYoutubeAudienceTrust(
        rawData,
        AUDIENCE_TRUST_WEIGHTS.youtube,
      );
      return { platform, score: result.score, breakdown: result.breakdown };
    }
    case "twitter": {
      const result = calculateTwitterAudienceTrust(
        rawData,
        AUDIENCE_TRUST_WEIGHTS.twitter
      );
      return { platform, score: result.score, breakdown: result.breakdown };
    }
    default:
      return null;
  }
}

export function calculateOverallAudienceTrust(
  platformResults: PlatformAudienceTrustResult[],
  platformWeights: Record<string, number>
): { overallScore: number; breakdown: PlatformAudienceTrustResult[],brandOverSafetyAllScore:number } {
  let weightedSum = 0;
  let brandSafetyWeightedSum = 0;
  let totalWeight = 0;

  
  for (const result of platformResults) {
    const weight = platformWeights[result.platform] ?? 0;
    weightedSum += result.score * (weight / 100);
    brandSafetyWeightedSum += result.breakdown.brandSafety * (weight / 100);
    totalWeight += weight;
  }

  const overallScore = totalWeight > 0 ? weightedSum : 0;
  const brandOverSafetyAllScore = brandSafetyWeightedSum > 0 ? brandSafetyWeightedSum : 0;
  console.log(brandOverSafetyAllScore,"brandOverSafetyAllScore");
  

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    breakdown: platformResults,
    brandOverSafetyAllScore
  };
}
