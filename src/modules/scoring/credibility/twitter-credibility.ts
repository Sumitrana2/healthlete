// core/credibility/twitter-credibility.ts

import { clamp, average, median } from "./credibility-utils";

interface TwitterWeights {
  audienceAuthenticity: number;
  growthHealth: number;
  engagementDistribution: number;
}

export function calculateTwitterCredibility(
  raw: any,
  weights: TwitterWeights
): { score: number; breakdown: Record<string, number> } {
  const mediaObj = raw?.report?.features?.most_media?.data?.media ?? {};
  const mediaItems = Object.values(mediaObj) as any[];

  const favoriteCounts = mediaItems.map((m) => m?.metrics?.favorite_count ?? 0);
  const replyCounts = mediaItems.map((m) => m?.metrics?.reply_count ?? 0);
  const subscribersCount = raw?.report?.metrics?.subscribers_count?.value ?? 0;

  // 1. Audience Authenticity
  const avgFavorites = average(favoriteCounts);
  const avgReplies = average(replyCounts);
  const engagementRatio =
    subscribersCount > 0 ? (avgFavorites + avgReplies) / subscribersCount : 0;
  const authenticityScore = clamp(engagementRatio / 0.02, 0, 1) * weights.audienceAuthenticity;

  // 2. Growth Health
  const growth30d = raw?.report?.metrics?.subscribers_growth_prc?.performance?.["30d"]?.value ?? 0;
  const growth90d = raw?.report?.metrics?.subscribers_growth_prc?.performance?.["90d"]?.value ?? 0;

  const growthScore30d = clamp((growth30d + 10) / 20, 0, 1) * (weights.growthHealth * (15 / 35));
  const growthScore90d = clamp((growth90d + 20) / 40, 0, 1) * (weights.growthHealth * (20 / 35));
  const growthScore = growthScore30d + growthScore90d;

  // 3. Engagement Distribution Quality
  const medianFavorites = median(favoriteCounts);
  const meanFavorites = average(favoriteCounts);
  const qualityRatio = meanFavorites > 0 ? medianFavorites / meanFavorites : 0;
  const qualityScore = clamp(qualityRatio, 0, 1) * weights.engagementDistribution;

  const totalScore = authenticityScore + growthScore + qualityScore;

  return {
    score: Math.round(totalScore * 100) / 100,
    breakdown: {
      audienceAuthenticity: Math.round(authenticityScore * 100) / 100,
      growthHealth: Math.round(growthScore * 100) / 100,
      engagementDistribution: Math.round(qualityScore * 100) / 100,
    },
  };
}