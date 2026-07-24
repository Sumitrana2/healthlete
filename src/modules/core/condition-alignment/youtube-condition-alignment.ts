// core/condition-alignment/youtube-condition-alignment.ts

import type { BrandProfile } from "./condition-alignment.types";

interface YoutubeAlignmentWeights {
  categoryMatch: number;
  bioMatch: number;
  interestMatch: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateYoutubeConditionAlignment(
  raw: any,
  brand: BrandProfile,
  weights: YoutubeAlignmentWeights
): { score: number; breakdown: Record<string, number> } {

  // ── 6.2.1 Category Match (40 pts) ────────────────────────────────────────────
  // result.report.features.blogger_thematics.data[] se brand categories match karo
  const bloggerThematics: number[] =
    raw?.report?.features?.blogger_thematics?.data ?? [];

  const categoryMatch = bloggerThematics.some((id) =>
    brand.categories.includes(id)
  )
    ? 1
    : 0;

  const categoryScore = categoryMatch * 100 * (weights.categoryMatch / 100);
  // Example: 0 * 100 * 0.40 = 0 (Darren YT = Music & Dance, not health)

  // ── 6.2.2 Bio Match (35 pts) ──────────────────────────────────────────────────
  // result.report.basic.description mein brand keywords dhundho
  const description: string = raw?.report?.basic?.description ?? "";

  const bioHits = brand.keywords.filter((keyword) =>
    description.toLowerCase().includes(keyword.toLowerCase())
  ).length;

  const bioScore = clamp(bioHits / 3, 0, 1) * 100 * (weights.bioMatch / 100);

  // ── 6.2.3 Interest Match (25 pts) ────────────────────────────────────────────
  // YouTube mein audience_interests nahi hota
  // Proxy: result.media[].features.hashtags[] se unique hashtags nikalo
  const mediaItems: any[] = raw?.media ?? [];

  const videoHashtags: string[] = [
    ...new Set(
      mediaItems
        .flatMap((m) => m?.features?.hashtags ?? [])
        .map((h: string) => h.toLowerCase())
    ),
  ];

  const totalCampaignKeywords = brand.keywords.length || 1;

  const matchedTags = brand.keywords.filter((keyword) =>
    videoHashtags.some((tag) => tag.includes(keyword.toLowerCase()))
  ).length;

  const interestScore =
    clamp(matchedTags / totalCampaignKeywords, 0, 1) * 100 * (weights.interestMatch / 100);

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