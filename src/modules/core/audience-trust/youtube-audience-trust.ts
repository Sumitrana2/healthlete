// core/audience-trust/youtube-audience-trust.ts

import { clamp } from "../credibility/credibility-utils";
import { TARGET_LANGUAGE } from "./audience-trust-weights.config";

interface YoutubeTrustWeights {
  languageConcentration: number;
  reachQuality: number;
  brandSafety: number;
}

export function calculateYoutubeAudienceTrust(
  raw: any,
  weights: YoutubeTrustWeights,
  targetLanguages: string[] = [TARGET_LANGUAGE]
): { score: number; breakdown: Record<string, number> } {
    const languagesData: { title: string; prc: number }[] =
    raw?.report?.features?.audience_languages?.data ?? [];

  const languagePercentage = languagesData
    .filter((lang) =>
      targetLanguages.some(
        (target) => target.toLowerCase() === lang.title?.toLowerCase()
      )
    )
    .reduce((sum, lang) => sum + (lang.prc ?? 0), 0);

  const languageScore =
    clamp(languagePercentage / 100, 0, 1) * weights.languageConcentration;

  const viewsAvg90d = raw?.report?.metrics?.views_avg?.performance?.["90d"]?.value ?? 0;
  const subscribersCount = raw?.metrics_history?.subscribers_count?.value ?? 0;

  const viewRate = subscribersCount > 0 ? viewsAvg90d / subscribersCount : 0;
  const reachScore = clamp(viewRate / 0.01, 0, 1) * weights.reachQuality;

  // 3. Brand Safety
  const brandSafetyData = raw?.report?.features?.brand_safety?.data;

  let brandSafetyScore: number;
  if (!brandSafetyData) {
    brandSafetyScore = weights.brandSafety / 2;   // neutral fallback (jaisa example mein 12.5)
  } else {
    const categories = Object.values(brandSafetyData) as boolean[];
    const totalChecks = categories.length;
    const riskFlags = categories.filter((v) => v === true).length;
    const safetyRatio = totalChecks > 0 ? (totalChecks - riskFlags) / totalChecks : 0.5;
    brandSafetyScore = safetyRatio * weights.brandSafety;
  }

  const totalScore = languageScore + reachScore + brandSafetyScore;

  return {
    score: Math.round(totalScore * 100) / 100,
    breakdown: {
      languageConcentration: Math.round(languageScore * 100) / 100,
      reachQuality: Math.round(reachScore * 100) / 100,
      brandSafety: Math.round(brandSafetyScore * 100) / 100,
    },
  };
}