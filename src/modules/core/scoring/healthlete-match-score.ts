const MATCH_WEIGHTS = {
  conditionAlignment: 0.25,
  credibility: 0.25,
  audienceTrust: 0.25,
  resonance: 0.25,
};

export function calculateMatchScore(
  finalScore: any,
  conditionAlignmentScore: number
): number {
  if (!finalScore) return 0;

  const score =
    conditionAlignmentScore * MATCH_WEIGHTS.conditionAlignment +
    (finalScore.credibilityScore ?? 0) * MATCH_WEIGHTS.credibility +
    (finalScore.audienceTrustScore ?? 0) * MATCH_WEIGHTS.audienceTrust +
    (finalScore.resonanceScore ?? 0) * MATCH_WEIGHTS.resonance;

  return Math.round(Math.round(score * 100) / 100);
}
