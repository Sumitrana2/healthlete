// core/audience-trust/twitter-audience-trust.ts

import { clamp, average } from "../credibility/credibility-utils";
import { BRAND_SAFETY_KEYWORDS } from "./audience-trust-weights.config";

interface TwitterTrustWeights {
  audienceAuthenticity: number;
  reachQuality: number;
  brandSafety: number;
}

export function calculateTwitterAudienceTrust(
  raw: any,
  weights: TwitterTrustWeights
): { score: number; breakdown: Record<string, number> } {
  const subscribersCount = raw?.report?.metrics?.subscribers_count?.value ?? 0;
  const followingCount = raw?.report?.metrics?.following_count?.value ?? 0;

  // 1. Audience Authenticity (log-scaled follower/following ratio)
  const ratio = subscribersCount / Math.max(followingCount, 1);
  const logRatio = ratio > 0 ? Math.log10(ratio) : 0;
  const authPct = clamp((logRatio / 3) * 100, 0, 100);
  const authenticityScore = (authPct / 100) * weights.audienceAuthenticity;

  // 2. Audience Reach Quality
  const mediaObj = raw?.report?.features?.most_media?.data?.media ?? {};
  const mediaItems = Object.values(mediaObj) as any[];

  const favoriteCounts = mediaItems.map((m) => m?.metrics?.favorite_count ?? 0);
  const replyCounts = mediaItems.map((m) => m?.metrics?.reply_count ?? 0);

  const avgEngagement = average(favoriteCounts) + average(replyCounts);
  const engRate = subscribersCount > 0 ? avgEngagement / subscribersCount : 0;
  const reachScoreRaw = Math.log10(1 + engRate * 100);
  const reachScore = clamp(reachScoreRaw / 2, 0, 1) * weights.reachQuality;

  // 3. Brand Safety (keyword-based text analysis)
  const tweetTexts: string[] = mediaItems.map((m) => m?.basic?.title ?? "").filter(Boolean);
  const description = raw?.report?.basic?.description ?? "";
  const allTexts = [...tweetTexts, description].join(" ").toLowerCase();

  const highRiskCount = BRAND_SAFETY_KEYWORDS.high.filter((kw) =>
    allTexts.includes(kw.toLowerCase())
  ).length;
  const mediumRiskCount = BRAND_SAFETY_KEYWORDS.medium.filter((kw) =>
    allTexts.includes(kw.toLowerCase())
  ).length;

  const baseScore = weights.brandSafety * 0.8;   // original example mein 20/25 = 0.8 ratio tha
  let brandSafetyScore: number;

  if (highRiskCount > 0) {
    brandSafetyScore = 0;
  } else {
    brandSafetyScore = baseScore - mediumRiskCount * (weights.brandSafety * 0.16);   // 4/25 = 0.16 ratio
  }

  brandSafetyScore = clamp(brandSafetyScore, 0, weights.brandSafety);

  const totalScore = authenticityScore + reachScore + brandSafetyScore;

  return {
    score: Math.round(totalScore * 100) / 100,
    breakdown: {
      audienceAuthenticity: Math.round(authenticityScore * 100) / 100,
      reachQuality: Math.round(reachScore * 100) / 100,
      brandSafety: Math.round(brandSafetyScore * 100) / 100,
    },
  };
}