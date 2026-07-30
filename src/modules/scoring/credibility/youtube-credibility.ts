// core/credibility/youtube-credibility.ts

import { clamp } from "./credibility-utils";

interface YoutubeWeights {
  creatorQuality: number;
  subscriberGrowth: number;
  geoConcentration: number;
}

export function calculateYoutubeCredibility(
  raw: any,
  weights: YoutubeWeights
): { score: number; breakdown: Record<string, number> } {
  // 1. Creator Quality Score
  const cqs = raw?.report?.features?.cqs?.data?.value ?? 0;
  const cqsScore = (cqs / 100) * weights.creatorQuality;

  // 2. Subscriber Growth Health
  const growth90 = raw?.report?.metrics?.subscribers_growth_prc?.performance?.["90d"]?.value ?? 0;
  const growth365 = raw?.report?.metrics?.subscribers_growth_prc?.performance?.["365d"]?.value ?? 0;

  const growthRatio = growth365 !== 0 ? growth90 / growth365 : 0;
  const growthScore = (clamp(growthRatio, 0, 2) / 2) * weights.subscriberGrowth;

  // 3. Audience Geography Concentration
  const geoData: { title: string; prc: number }[] = raw?.report?.features?.audience_geo?.data ?? [];

  let geoScore = 0;
  if (geoData.length) {
    const concentrationIndex = geoData.reduce(
      (sum, item) => sum + Math.pow(item.prc / 100, 2),
      0
    );
    geoScore = clamp(concentrationIndex, 0, 1) * weights.geoConcentration;
  }

  const totalScore = cqsScore + growthScore + geoScore;

  return {
    score: Math.round(totalScore * 100) / 100,
    breakdown: {
      creatorQuality: Math.round(cqsScore * 100) / 100,
      subscriberGrowth: Math.round(growthScore * 100) / 100,
      geoConcentration: Math.round(geoScore * 100) / 100,
    },
  };
}