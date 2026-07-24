// core/credibility/credibility.types.ts

export interface CredibilityWeights {
    instagram: {
      realFollowers: number;
      organicGrowth: number;
      audienceQuality: number;
    };
    youtube: {
      creatorQuality: number;
      subscriberGrowth: number;
      geoConcentration: number;
    };
    twitter: {
      audienceAuthenticity: number;
      growthHealth: number;
      engagementDistribution: number;
    };
  }
  
  export interface PlatformCredibilityResult {
    platform: string;
    score: number;
    breakdown: Record<string, number>;
  }