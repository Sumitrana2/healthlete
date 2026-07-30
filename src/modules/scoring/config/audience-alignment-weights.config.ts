export const AUDIENCE_ALIGNMENT_DYNAMIC_WEIGHTS = {
  languageMatch: 20,
  healthConditionMatch: 20,
};

export const AUDIENCE_ALIGNMENT_STATIC_WEIGHTS = {
  ageRangeMatch: 20,
  countryMatch: 20,
  positiveSentiment: 12,
  bloggerReach: 8,
};

export const AUDIENCE_ALIGNMENT_STATIC_CONFIG = {
  age: { min: 18, max: 45 },
  countries: ["us"],
  positiveSentimentMin: 60,
  bloggerReachMin: 100,
};
