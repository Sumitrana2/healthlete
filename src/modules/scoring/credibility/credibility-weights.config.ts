// core/credibility/credibility-weights.config.ts

import type { CredibilityWeights } from "./credibility.types";

export const CREDIBILITY_WEIGHTS: CredibilityWeights = {
  instagram: {
    realFollowers: 40,
    organicGrowth: 35,
    audienceQuality: 25,
  },
  youtube: {
    creatorQuality: 40,
    subscriberGrowth: 35,
    geoConcentration: 25,
  },
  twitter: {
    audienceAuthenticity: 40,
    growthHealth: 35,
    engagementDistribution: 25,
  },
};