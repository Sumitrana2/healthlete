// core/audience-trust/audience-trust-weights.config.ts

import type { AudienceTrustWeights } from "./audience-trust.types";

export const AUDIENCE_TRUST_WEIGHTS: AudienceTrustWeights = {
  instagram: {
    audienceAuthenticity: 40,
    audienceReachability: 35,
    brandSafety: 25,
  },
  youtube: {
    languageConcentration: 40,
    reachQuality: 35,
    brandSafety: 25,
  },
  twitter: {
    audienceAuthenticity: 40,
    reachQuality: 35,
    brandSafety: 25,
  },
};

export const TARGET_LANGUAGE = "en";   // YouTube ke language concentration ke liye default

export const BRAND_SAFETY_KEYWORDS = {
  high: ["violence", "hate", "explicit", "illegal drugs", "threat"],
  medium: ["alcohol", "aggressive", "controversial", "profanity"],
};