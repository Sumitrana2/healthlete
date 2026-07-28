// core/condition-alignment/condition-alignment.types.ts

export interface BrandAlignmentInput {
    healthConditions: string[];   // ["Heart Disease", "Obesity"]
    languageCodes: string[];      // ["en"]
    preferredChannels: string[];  // ["YouTube"]
  }
  
  export interface MatchedHealthCondition {
    brandCondition: string;       // Brand ne jo diya: "Heart Disease"
    matchedKeyword: string;       // DB mein jo match hua: "cardiac"
    resonanceScore: number;       // Athlete ka score: 75
  }
  
  export interface ConditionAlignmentResult {
    overallScore: number;
    breakdown: {
      languageScore: number;
      channelScore: number;
      healthConditionScore: number;
      hashtagScore: number;
    };
    details: {
      matchedLanguage: boolean;
      matchedChannel: boolean;
      matchedHealthConditions: MatchedHealthCondition[];
      matchedHashtags: string[];
    };
  }