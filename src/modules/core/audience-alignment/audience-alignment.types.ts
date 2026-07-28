// core/audience-alignment/audience-alignment.types.ts

// Brand se runtime aane wala input
export interface AudienceAlignmentInput {
    languageCodes: string[];        // ["en"]
    healthConditions: string[];     // ["HIV", "Diabetes"]
  }
  
  export interface AudienceAlignmentBreakdown {
    // Dynamic
    languageScore: number;
    healthConditionScore: number;
    // Static
    ageRangeScore: number;
    countryScore: number;
    positiveSentimentScore: number;
    bloggerReachScore: number;
  }
  
  export interface AudienceAlignmentResult {
    overallScore: number;
    breakdown: AudienceAlignmentBreakdown;
    details: {
      matchedLanguage: boolean;
      matchedHealthConditions: string[];
      audienceAgeInRange: number;      // % of audience in brand's age range
      matchedCountry: boolean;
      positiveSentimentPct: number;    // actual positive sentiment %
      bloggerReach: number;            // actual reach value
    };
  }