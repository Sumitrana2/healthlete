// core/condition-alignment/twitter-condition-alignment.ts

import type { BrandProfile } from "./condition-alignment.types";

interface TwitterAlignmentWeights {
  bioMatch: number;   // 100 — sirf bio match hai Twitter pe
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateTwitterConditionAlignment(
  raw: any,
  brand: BrandProfile,
  weights: TwitterAlignmentWeights
): { score: number; breakdown: Record<string, number> } {

  // ── 6.3.1 Bio Match (100 pts) ─────────────────────────────────────────────────
  // Twitter pe sirf description available hai
  // result.report.basic.description mein brand keywords dhundho
  const description: string = raw?.report?.basic?.description ?? "";

  const bioHits = brand.keywords.filter((keyword) =>
    description.toLowerCase().includes(keyword.toLowerCase())
  ).length;

  // Max 3 hits = full marks
  const bioScore = clamp(bioHits / 3, 0, 1) * 100 * (weights.bioMatch / 100);
  // weights.bioMatch = 100, so: clamp(hits/3, 0, 1) * 100 * 1.0

  return {
    score: Math.round(bioScore * 100) / 100,
    breakdown: {
      bioMatch: Math.round(bioScore * 100) / 100,
    },
  };
}