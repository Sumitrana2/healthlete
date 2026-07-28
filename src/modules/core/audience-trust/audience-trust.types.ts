// core/audience-trust/audience-trust.types.ts

export interface AudienceTrustWeights {
    instagram: {
      audienceAuthenticity: number;
      audienceReachability: number;
      brandSafety: number;
    };
    youtube: {
     audienceQuality: number;
      reachQuality: number;
      brandSafety: number;
    };
    twitter: {
      audienceAuthenticity: number;
      reachQuality: number;
      brandSafety: number;
    };
  }
  
  export interface PlatformAudienceTrustResult {
    platform: string;
    score: number;
    breakdown: Record<string, number>;
  }