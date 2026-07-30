export const PLATFORM_WEIGHTS: Record<string, number> = {
  instagram: 50,
  youtube: 35,
  twitter: 15,
};

export function calculateNormalizedWeights(
  linkedPlatforms: string[]
): Record<string, number> {
  const total = linkedPlatforms.reduce(
    (sum, p) => sum + (PLATFORM_WEIGHTS[p] ?? 0),
    0
  );

  if (total === 0) return {};

  return Object.fromEntries(
    linkedPlatforms.map((p) => [
      p,
      Number((((PLATFORM_WEIGHTS[p] ?? 0) / total) * 100).toFixed(2)),
    ])
  );
}