/** Map Nest report_state enum values to Node's reportState strings. */
export function toNodeReportState(state: string | null | undefined): string {
  switch (state) {
    case "completed":
      return "ready";
    case "processing":
      return "syncing";
    case "pending":
      return "not_synced";
    case "failed":
      return "failed";
    case "ready":
    case "syncing":
    case "not_synced":
      return state;
    default:
      return state ?? "not_synced";
  }
}

export function mapPlatformLinkToNodeShape(
  link: {
    id: string;
    athleteId?: string;
    platform: string;
    username?: string | null;
    hyperauditSocialId?: string | null;
    providerSocialId?: string | null;
    provider?: string | null;
    profileUrl?: string | null;
    displayTitle?: string | null;
    subscribersCount?: number | null;
    isVerified?: boolean | null;
    reportState?: string | null;
    lastSyncedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
    avatarUrl?: string | null;
  },
  athleteId?: string,
) {
  return {
    id: link.id,
    athleteId: link.athleteId ?? athleteId ?? null,
    provider: link.provider ?? "hyperauditor",
    platform: link.platform,
    providerSocialId:
      link.providerSocialId ?? link.hyperauditSocialId ?? null,
    username: link.username ?? null,
    profileUrl: link.profileUrl ?? null,
    avatarUrl: link.avatarUrl ?? null,
    displayTitle: link.displayTitle ?? null,
    subscribersCount: link.subscribersCount ?? null,
    isVerified: link.isVerified ?? false,
    reportState: toNodeReportState(link.reportState),
    lastSyncedAt: link.lastSyncedAt ?? null,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

export function mapFinalScoreToNodeShape(
  score:
    | {
        id: string;
        athleteId: string;
        resonanceScore?: string | number | null;
        credibilityScore?: string | number | null;
        audienceTrustScore?: string | number | null;
        brandOverSafetyScore?: string | number | null;
        conditionAlignmentScore?: string | number | null;
        healthleteMatchScore?: string | number | null;
        avgEngagementRate?: string | number | null;
        avgLikes?: string | number | null;
        avgComments?: string | number | null;
        engagementQualityScore?: string | number | null;
        weightDistribution?: unknown;
        scoreBreakdown?: unknown;
        calculatedAt?: Date;
        createdAt?: Date;
        updatedAt?: Date;
      }
    | null
    | undefined,
) {
  if (!score) return null;

  const toNum = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  return {
    id: score.id,
    athleteId: score.athleteId,
    resonanceScore: toNum(score.resonanceScore),
    credibilityScore: toNum(score.credibilityScore),
    audienceTrustScore: toNum(score.audienceTrustScore),
    brandOverSafetyScore: toNum(score.brandOverSafetyScore) ?? 0,
    conditionAlignmentScore: toNum(score.conditionAlignmentScore),
    healthleteMatchScore: toNum(score.healthleteMatchScore),
    avgEngagementRate: toNum(score.avgEngagementRate),
    avgLikes: toNum(score.avgLikes),
    avgComments: toNum(score.avgComments),
    engagementQualityScore: toNum(score.engagementQualityScore),
    weightDistribution: score.weightDistribution ?? null,
    scoreBreakdown: score.scoreBreakdown ?? null,
    calculatedAt: score.calculatedAt,
    createdAt: score.createdAt,
    updatedAt: score.updatedAt,
  };
}
