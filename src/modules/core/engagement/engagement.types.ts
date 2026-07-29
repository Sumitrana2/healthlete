// core/engagement/engagement.types.ts

export interface EngagementQualityResult {
    avgEngagementRate: number | null;
    avgLikes: number | null;
    avgComments: number | null;
    engagementQualityScore: number;
    breakdown: {
      platform: string;
      avgEngagementRate: number | null;
      avgLikes: number | null;
      avgComments: number | null;
      mark: string | null;
      markScore: number | null;
    }[];
  }