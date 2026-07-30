export interface AudienceAlignmentBreakdown {
  languageScore: number;
  healthConditionScore: number;
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
    audienceAgeInRange: number;
    matchedCountry: boolean;
    positiveSentimentPct: number;
    bloggerReach: number;
  };
}
