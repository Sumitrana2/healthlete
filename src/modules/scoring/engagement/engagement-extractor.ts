export interface PlatformEngagementMetrics {
  avgEngagementRate: number | null;
  avgLikes: number | null;
  avgComments: number | null;
}

function extractInstagramEngagement(raw: any): PlatformEngagementMetrics {
  return {
    avgEngagementRate: raw?.user?.er?.value ?? null,
    avgLikes: raw?.user?.avg_likes ?? null,
    avgComments: raw?.user?.avg_comments ?? null,
  };
}

function extractYoutubeEngagement(raw: any): PlatformEngagementMetrics {
  return {
    avgEngagementRate:
      raw?.report?.metrics?.er?.performance?.all?.value ?? null,
    avgLikes: raw?.metrics_history?.likes_avg?.value ?? null,
    avgComments:
      raw?.report?.metrics?.comments_avg?.performance?.all?.value ?? null,
  };
}

function extractTwitterEngagement(raw: any): PlatformEngagementMetrics {
  return {
    avgEngagementRate:
      raw?.report?.metrics?.er?.performance?.["180d"]?.value ??
      raw?.report?.metrics?.er?.performance?.["90d"]?.value ??
      null,
    avgLikes:
      raw?.report?.metrics?.favorite_avg?.performance?.["180d"]?.value ??
      raw?.report?.metrics?.favorite_avg?.performance?.["90d"]?.value ??
      null,
    avgComments:
      raw?.report?.metrics?.reply_avg?.performance?.["180d"]?.value ??
      raw?.report?.metrics?.reply_avg?.performance?.["90d"]?.value ??
      null,
  };
}

export function extractEngagementMetrics(
  platform: string,
  raw: any,
): PlatformEngagementMetrics {
  switch (platform) {
    case "instagram":
      return extractInstagramEngagement(raw);
    case "youtube":
      return extractYoutubeEngagement(raw);
    case "twitter":
      return extractTwitterEngagement(raw);
    default:
      return { avgEngagementRate: null, avgLikes: null, avgComments: null };
  }
}
