// core/engagement/engagement.service.ts

import { extractEngagementMetrics } from "./engagement-extractor";
// import type { PlatformEngagementMetrics } from "./engagement-extractor";
import type { EngagementQualityResult } from "./engagement.types";

function extractEngagementMark(platform: string, raw: any): string | null {
  switch (platform) {
    case "instagram":
      return raw?.user?.er?.title ?? null;
    case "youtube":
      return raw?.report?.metrics?.er?.performance?.all?.mark ?? null;
    case "twitter":
      return  raw?.report?.metrics?.tweets_number?.performance?.["90d"]?.mark  ?? raw?.report?.metrics?.tweets_number?.performance?.mark ?? null;
    default:
      return null;
  }
}

function markToScore(mark: string | null): number | null {
  if (!mark) return null;
  switch (mark.toLowerCase()) {
    case "excellent": return 100;
    case "very_good": return 85;
    case "good": return 70;
    case "average": return 50;
    case "fair": return 35;
    case "poor": return 15;
    case "none": return 0;
    default: return null;
  }
}

export function calculateEngagementQuality(
  platformLinks: { platform: string; rawData: any }[],
  platformWeights: Record<string, number>
): EngagementQualityResult {
  const breakdown = platformLinks
    .filter((l) => l.rawData)
    .map((l) => {
      const metrics = extractEngagementMetrics(l.platform, l.rawData);
      
      const mark = extractEngagementMark(l.platform, l.rawData);
      const markScore = markToScore(mark);

      return {
        platform: l.platform,
        avgEngagementRate: metrics.avgEngagementRate,
        avgLikes: metrics.avgLikes,
        avgComments: metrics.avgComments,
        mark,
        markScore,
      };
    });

   console.log(breakdown,"breakdownbreakdown");
    

  // ── Raw averages — weighted combine (Card 1) ────────────────────────────────
  const weightedAvg = (field: "avgEngagementRate" | "avgLikes" | "avgComments"): number | null => {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const b of breakdown) {
      const value = b[field];
      if (value === null || value === undefined) continue;
      const weight = platformWeights[b.platform] ?? 0;
      weightedSum += value * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : null;
  };

  let markWeightedSum = 0;
  let markTotalWeight = 0;

  for (const b of breakdown) {
    if (b.markScore === null) continue;
    const weight = platformWeights[b.platform] ?? 0;
    markWeightedSum += b.markScore * weight;
    markTotalWeight += weight;
  }

  const engagementQualityScore =
    markTotalWeight > 0 ? Math.round((markWeightedSum / markTotalWeight) * 100) / 100 : 0;

  return {
    avgEngagementRate: weightedAvg("avgEngagementRate"),
    avgLikes: weightedAvg("avgLikes"),
    avgComments: weightedAvg("avgComments"),
    engagementQualityScore,
    breakdown,
  };
}