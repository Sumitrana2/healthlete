// core/condition-alignment/instagram-condition-alignment.ts

import type { BrandProfile } from "./condition-alignment.types";

interface InstagramAlignmentWeights {
  categoryMatch: number;
  bioMatch: number;
  interestMatch: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateInstagramConditionAlignment(
  raw: any,
  brand: BrandProfile,
  weights: InstagramAlignmentWeights
): { score: number; breakdown: Record<string, number> } {

  // ── 6.1.1 Category Match (40 pts) ────────────────────────────────────────────
  // result.user.blogger_categories[] se brand categories match karo
  const bloggerCategories: number[] = raw?.user?.blogger_categories ?? [];

  const categoryMatch = bloggerCategories.some((id) =>
    brand.categories.includes(id)
  )
    ? 1
    : 0;

  const categoryScore = categoryMatch * 100 * (weights.categoryMatch / 100);
  // Example: 1 * 100 * 0.40 = 40

  // ── 6.1.2 Bio Match (35 pts) ──────────────────────────────────────────────────
  // result.user.about mein brand keywords dhundho
  const about: string = raw?.user?.about ?? "";

  const bioHits = brand.keywords.filter((keyword) =>
    about.toLowerCase().includes(keyword.toLowerCase())
  ).length;

  // Max 3 hits = full marks — keyword stuffing prevent karo
  const bioScore = clamp(bioHits / 3, 0, 1) * 100 * (weights.bioMatch / 100);
  // Example: clamp(2/3, 0, 1) * 100 * 0.35 = 0.667 * 100 * 0.35 = 23.33

  // ── 6.1.3 Interest Match (25 pts) ────────────────────────────────────────────
  // audience_interests[].name se brand interests match karo
  const audienceInterests: [string, number][] = raw?.user?.audience_interests ?? [];
  const interestNames = audienceInterests.map(([name]) => name.toLowerCase());

  const matchedInterests = brand.interests.filter((interest) =>
    interestNames.some((name) => name.includes(interest.toLowerCase()))
  ).length;

  const totalCampaignInterests = brand.interests.length || 1;
  const interestScore =
    (matchedInterests / totalCampaignInterests) * 100 * (weights.interestMatch / 100);
  // Example: (1/3) * 100 * 0.25 = 8.33

  const totalScore = categoryScore + bioScore + interestScore;

  return {
    score: Math.round(totalScore * 100) / 100,
    breakdown: {
      categoryMatch: Math.round(categoryScore * 100) / 100,
      bioMatch: Math.round(bioScore * 100) / 100,
      interestMatch: Math.round(interestScore * 100) / 100,
    },
  };
}