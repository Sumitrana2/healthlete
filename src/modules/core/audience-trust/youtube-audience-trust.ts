// // core/audience-trust/youtube-audience-trust.ts

import { clamp } from "../credibility/credibility-utils";

interface YoutubeTrustWeights {
  audienceQuality: number;   
  reachQuality: number;
  brandSafety: number;
}

export function calculateYoutubeAudienceTrust(
  raw: any,
  weights: YoutubeTrustWeights
): { score: number; breakdown: Record<string, number> } {
  const cqsValue = raw?.features?.cqs?.data?.value;                     
  const sentimentScoreRaw = raw?.features?.audience_sentiments?.data?.score; 

  const validScores = [cqsValue, sentimentScoreRaw].filter(
    (v): v is number => v !== undefined && v !== null
  );

  let audienceQualityScore: number;
  if (!validScores.length) {
    audienceQualityScore = weights.audienceQuality / 2;   // neutral fallback
  } else {
    const avgRawScore = validScores.reduce((sum, v) => sum + v, 0) / validScores.length;
    audienceQualityScore = clamp(avgRawScore / 100, 0, 1) * weights.audienceQuality;
  }

  // 2. Audience Reach Quality
  const viewsAvg90d = raw?.metrics?.views_avg?.performance?.["90d"]?.value ?? 0;
  const subscribersCount = raw?.metrics?.subscribers_count?.value ?? 0;

  const viewRate = subscribersCount > 0 ? viewsAvg90d / subscribersCount : 0;
  const reachScore = clamp(viewRate / 0.01, 0, 1) * weights.reachQuality;

  // 3. Brand Safety
  const brandSafetyData = raw?.features?.brand_safety?.data;

  let brandSafetyScore: number;
  if (!brandSafetyData || typeof brandSafetyData !== "object") {
    brandSafetyScore = weights.brandSafety / 2;
  } else {
    const categories = Object.values(brandSafetyData) as boolean[];
    const totalChecks = categories.length;

    if (totalChecks === 0) {
      brandSafetyScore = weights.brandSafety / 2;
    } else {
      const riskFlags = categories.filter((v) => v === true).length;
      const safetyRatio = (totalChecks - riskFlags) / totalChecks;
      brandSafetyScore = safetyRatio * weights.brandSafety;
    }
  }

  const totalScore = audienceQualityScore + reachScore + brandSafetyScore;

  return {
    score: Math.round(totalScore * 100) / 100,
    breakdown: {
      audienceQuality: Math.round(audienceQualityScore * 100) / 100,
      reachQuality: Math.round(reachScore * 100) / 100,
      brandSafety: Math.round(brandSafetyScore * 100) / 100,
    },
  };
}