// core/credibility/instagram-credibility.ts

import { clamp, markScore } from "./credibility-utils";

interface InstagramWeights {
  realFollowers: number;
  organicGrowth: number;
  audienceQuality: number;
}

export function calculateInstagramCredibility(
  raw: any,
  weights: InstagramWeights
): { score: number; breakdown: Record<string, number> } {
  // 1. Real Followers
  const realFollowersPct = raw?.user?.audience_type?.real ?? 0;
  const realScore = (realFollowersPct / 100) * weights.realFollowers;

  // 2. Organic Growth
  const anomalies = raw?.user?.blogger_graph_anomalies ?? {};
  const score1 = markScore(anomalies?.description?.mark);
  const score2 = markScore(anomalies?.description_followers?.mark);
  const score3 = markScore(anomalies?.description_followings?.mark);
  const avgBonus = (score1 + score2 + score3) / 3;
  const organicScore = avgBonus * weights.organicGrowth;

  // 3. Audience Quality Score
  const aqs = raw?.user?.aqs ?? 0;
  const aqsScore = (aqs / 100) * weights.audienceQuality;

  const totalScore = realScore + organicScore + aqsScore;

  return {
    score: Math.round(totalScore * 100) / 100,
    breakdown: {
      realFollowers: Math.round(realScore * 100) / 100,
      organicGrowth: Math.round(organicScore * 100) / 100,
      audienceQuality: Math.round(aqsScore * 100) / 100,
    },
  };
}