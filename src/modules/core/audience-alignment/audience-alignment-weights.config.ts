// core/audience-alignment/audience-alignment-weights.config.ts

// ── Dynamic weights (brand se runtime aayenge) ────────────────────────────────
export const AUDIENCE_ALIGNMENT_DYNAMIC_WEIGHTS = {
    languageMatch: 20,
    healthConditionMatch: 20,
  };
  
  // ── Static weights (default values — config se) ───────────────────────────────
  export const AUDIENCE_ALIGNMENT_STATIC_WEIGHTS = {
    ageRangeMatch: 20,
    countryMatch: 20,
    positiveSentiment: 12,
    bloggerReach: 8,
  };
  
  // ── Static default values ─────────────────────────────────────────────────────
  export const AUDIENCE_ALIGNMENT_STATIC_CONFIG = {
    age: { min: 18, max: 45 },
    countries: ["us"],
    positiveSentimentMin: 60,  // minimum % positive sentiment required
    bloggerReachMin: 100,      // minimum reach required
  };