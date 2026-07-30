import {
  clampDecimalScore,
  normalizeEngagementMetric,
} from "../../../modules/scoring/utils/score-normalization.util";

export type ExtractedPlatformAnalytics = {
  followers: number | null;
  engagementRate: number | null;
  avgLikes: number | null;
  avgComments: number | null;
  avgViews: number | null;
  avgShares: number | null;
  reach: number | null;
  audienceQualityScore: number | null;
  realFollowersPct: number | null;
  fakeFollowersPct: number | null;
  brandMentions: number | null;
  demographics: {
    gender: { female: number; male: number } | null;
    ageGroups: { range: string; pct: number }[];
    topCountries: { country: string; pct: number }[];
    topCities: { city: string; pct: number }[];
  };
  interests: { name: string; pct: number }[];
  languages: { name: string; pct: number }[];
  scores: {
    erScore: number | null;
    commentScore: number | null;
    sentimentScore: number | null;
    spreadScore: number | null;
    consistencyScore: number | null;
    resonanceScore: number | null;
    credibilityScore: number | null;
    audienceTrustScore: number | null;
    conditionAlignmentScore: number | null;
  };
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(/[%$,]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickNumber(
  sources: Array<Record<string, unknown> | null>,
  keys: string[],
): number | null {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = asNumber(source[key]);
      if (value !== null) return value;
    }
  }
  return null;
}

function collectNested(
  root: Record<string, unknown>,
  key: string,
): Record<string, unknown> | null {
  const direct = asRecord(root[key]);
  if (direct) return direct;

  for (const value of Object.values(root)) {
    const record = asRecord(value);
    if (record && key in record) {
      return asRecord(record[key]);
    }
  }

  return null;
}

function extractDistribution(
  value: unknown,
  labelKey: string,
  valueKey = "value",
): { name: string; pct: number }[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const name = String(record[labelKey] ?? record.name ?? record.title ?? "");
      const pct = asNumber(record[valueKey] ?? record.pct ?? record.percent);
      if (!name || pct === null) return null;
      return { name, pct };
    })
    .filter((item): item is { name: string; pct: number } => item !== null)
    .slice(0, 10);
}

function extractGender(
  root: Record<string, unknown>,
): { female: number; male: number } | null {
  const gender = collectNested(root, "audience_gender") ?? collectNested(root, "gender");
  if (!gender) return null;

  const female = pickNumber([gender], ["female", "women", "f"]);
  const male = pickNumber([gender], ["male", "men", "m"]);
  if (female === null && male === null) return null;

  return {
    female: female ?? Math.max(0, 100 - (male ?? 0)),
    male: male ?? Math.max(0, 100 - (female ?? 0)),
  };
}

function extractAgeGroups(root: Record<string, unknown>) {
  const ages =
    collectNested(root, "audience_age") ??
    collectNested(root, "audience_ages") ??
    collectNested(root, "age");

  if (!ages) return [];

  const distribution = ages.distribution ?? ages.data ?? ages;
  return extractDistribution(distribution, "name").map((item) => ({
    range: item.name,
    pct: item.pct,
  }));
}

function extractLocations(
  root: Record<string, unknown>,
  key: string,
  label: "country" | "city",
) {
  const section = collectNested(root, key);
  if (!section) return [];

  const distribution = section.distribution ?? section.data ?? section;
  return extractDistribution(distribution, label).map((item) => ({
    [label]: item.name,
    pct: item.pct,
  })) as Array<{ country: string; pct: number } | { city: string; pct: number }>;
}

export function extractPlatformAnalytics(
  payload: Record<string, unknown>,
): ExtractedPlatformAnalytics {
  const report = asRecord(payload.report) ?? payload;
  const user = asRecord(payload.user) ?? asRecord(report.user);
  const metrics =
    asRecord(payload.metrics) ??
    asRecord(report.metrics) ??
    asRecord(report.report_metrics) ??
    asRecord(payload.report_metrics);

  const sources = [metrics, report, user, payload];
  const followers = pickNumber(sources, [
    "followers_count",
    "subscribers_count",
    "followers",
    "subscriber_count",
  ]);

  const engagementRate = pickNumber(sources, [
    "engagement_rate",
    "er",
    "avg_er",
    "engagement_rate_avg",
  ]);

  const avgLikes = pickNumber(sources, ["avg_likes", "average_likes", "likes_avg"]);
  const avgComments = pickNumber(sources, [
    "avg_comments",
    "average_comments",
    "comments_avg",
  ]);
  const avgViews = pickNumber(sources, ["avg_views", "average_views", "views_avg"]);
  const avgShares = pickNumber(sources, ["avg_shares", "average_shares", "shares_avg"]);
  const reach = pickNumber(sources, ["reach", "avg_reach", "estimated_reach"]);

  const audienceQuality = collectNested(report, "audience_followers") ?? collectNested(report, "audience_quality");
  const audienceQualityScore = pickNumber(
    [audienceQuality, ...sources],
    ["aqs", "audience_quality_score", "quality_score", "score"],
  );

  const realFollowersPct = pickNumber(
    [audienceQuality, ...sources],
    ["real_followers", "real_followers_percent", "real_pct", "real"],
  );

  const fakeFollowersPct = pickNumber(
    [audienceQuality, ...sources],
    ["fake_followers", "fake_followers_percent", "fake_pct", "fake"],
  );

  const brandMentions = pickNumber(sources, [
    "brand_mentions",
    "sponsored_posts",
    "mentions_count",
  ]);

  const interestsSection =
    collectNested(report, "audience_interests") ?? collectNested(report, "interests");
  const interests = extractDistribution(
    interestsSection?.data ?? interestsSection?.distribution ?? interestsSection,
    "name",
  );

  const languagesSection =
    collectNested(report, "audience_languages") ?? collectNested(report, "languages");
  const languages = extractDistribution(
    languagesSection?.data ?? languagesSection?.distribution ?? languagesSection,
    "name",
  );

  const credibilityScore = audienceQualityScore;
  const audienceTrustScore = realFollowersPct;
  const erScore = clampDecimalScore(
    engagementRate !== null
      ? engagementRate <= 1
        ? engagementRate * 100
        : engagementRate
      : null,
  );

  const resonanceScore = clampDecimalScore(
    erScore !== null && audienceTrustScore !== null
      ? (erScore + audienceTrustScore) / 2
      : erScore ?? audienceTrustScore,
  );

  return {
    followers,
    engagementRate: erScore,
    avgLikes,
    avgComments,
    avgViews,
    avgShares,
    reach,
    audienceQualityScore,
    realFollowersPct,
    fakeFollowersPct,
    brandMentions,
    demographics: {
      gender: extractGender(report),
      ageGroups: extractAgeGroups(report),
      topCountries: extractLocations(report, "audience_geo", "country") as {
        country: string;
        pct: number;
      }[],
      topCities: extractLocations(report, "audience_cities", "city") as {
        city: string;
        pct: number;
      }[],
    },
    interests,
    languages,
    scores: {
      erScore: clampDecimalScore(erScore),
      commentScore: normalizeEngagementMetric(avgComments),
      sentimentScore: null,
      spreadScore: normalizeEngagementMetric(reach),
      consistencyScore: null,
      resonanceScore: clampDecimalScore(resonanceScore),
      credibilityScore: clampDecimalScore(credibilityScore),
      audienceTrustScore: clampDecimalScore(audienceTrustScore),
      conditionAlignmentScore: null,
    },
  };
}

export function mergePlatformAnalytics(
  items: ExtractedPlatformAnalytics[],
): ExtractedPlatformAnalytics {
  if (items.length === 0) {
    return extractPlatformAnalytics({});
  }

  const weighted = items.map((item, index) => ({
    item,
    weight: item.followers ?? index + 1,
  }));

  const weightedAvg = (selector: (item: ExtractedPlatformAnalytics) => number | null) => {
    let sum = 0;
    let weight = 0;
    for (const entry of weighted) {
      const value = selector(entry.item);
      if (value === null) continue;
      sum += value * entry.weight;
      weight += entry.weight;
    }
    return weight > 0 ? Number((sum / weight).toFixed(2)) : null;
  };

  const primary = [...items].sort(
    (a, b) => (b.followers ?? 0) - (a.followers ?? 0),
  )[0];

  const mergedInterests = new Map<string, number>();
  for (const item of items) {
    for (const interest of item.interests) {
      mergedInterests.set(
        interest.name,
        Math.max(mergedInterests.get(interest.name) ?? 0, interest.pct),
      );
    }
  }

  return {
    followers: weighted.reduce((sum, entry) => sum + (entry.item.followers ?? 0), 0) || null,
    engagementRate: weightedAvg((item) => item.engagementRate),
    avgLikes: weightedAvg((item) => item.avgLikes),
    avgComments: weightedAvg((item) => item.avgComments),
    avgViews: weightedAvg((item) => item.avgViews),
    avgShares: weightedAvg((item) => item.avgShares),
    reach: weighted.reduce((sum, entry) => sum + (entry.item.reach ?? 0), 0) || null,
    audienceQualityScore: weightedAvg((item) => item.audienceQualityScore),
    realFollowersPct: weightedAvg((item) => item.realFollowersPct),
    fakeFollowersPct: weightedAvg((item) => item.fakeFollowersPct),
    brandMentions: weighted.reduce(
      (sum, entry) => sum + (entry.item.brandMentions ?? 0),
      0,
    ) || null,
    demographics: primary.demographics,
    interests: [...mergedInterests.entries()]
      .map(([name, pct]) => ({ name, pct }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 10),
    languages: primary.languages,
    scores: {
      erScore: weightedAvg((item) => item.scores.erScore),
      commentScore: weightedAvg((item) => item.scores.commentScore),
      sentimentScore: weightedAvg((item) => item.scores.sentimentScore),
      spreadScore: weightedAvg((item) => item.scores.spreadScore),
      consistencyScore: weightedAvg((item) => item.scores.consistencyScore),
      resonanceScore: weightedAvg((item) => item.scores.resonanceScore),
      credibilityScore: weightedAvg((item) => item.scores.credibilityScore),
      audienceTrustScore: weightedAvg((item) => item.scores.audienceTrustScore),
      conditionAlignmentScore: weightedAvg(
        (item) => item.scores.conditionAlignmentScore,
      ),
    },
  };
}
