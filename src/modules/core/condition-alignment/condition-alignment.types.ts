// core/condition-alignment/condition-alignment.types.ts

export interface BrandProfile {
    categories: number[];      // HypeAuditor category IDs — brand signup se
    keywords: string[];        // Bio match ke liye — brand signup se
    interests: string[];       // Interest match ke liye — brand signup se
  }
  
  export interface ConditionAlignmentWeights {
    instagram: {
      categoryMatch: number;   // 40
      bioMatch: number;        // 35
      interestMatch: number;   // 25
    };
    youtube: {
      categoryMatch: number;   // 40
      bioMatch: number;        // 35
      interestMatch: number;   // 25
    };
    twitter: {
      bioMatch: number;        // 100
    };
  }
  
  export interface PlatformConditionAlignmentResult {
    platform: string;
    score: number;
    breakdown: Record<string, number>;
  }