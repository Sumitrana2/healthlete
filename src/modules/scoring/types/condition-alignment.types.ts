export interface MatchedHealthCondition {
  brandCondition: string;
  matchedKeyword: string;
  resonanceScore: number;
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
