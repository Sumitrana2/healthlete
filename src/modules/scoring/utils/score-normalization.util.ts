const SCORE_MAX = 999.99;

export function clampDecimalScore(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const clamped = Math.min(SCORE_MAX, Math.max(0, value));
  return Number(clamped.toFixed(2));
}

/** Normalize large engagement counts (likes, comments, reach) to a 0–100 score. */
export function normalizeEngagementMetric(value: number | null): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  if (value <= 100) return clampDecimalScore(value);
  return clampDecimalScore(Math.min(100, Math.log10(value + 1) * 25));
}

/** Normalize follower count to a 0–100 weight for decimal score columns. */
export function normalizeFollowerWeight(followers: number | null): number | null {
  if (followers === null || !Number.isFinite(followers)) return null;
  if (followers <= 100) return clampDecimalScore(followers);
  return clampDecimalScore(Math.min(100, Math.log10(followers + 1) * 20));
}
