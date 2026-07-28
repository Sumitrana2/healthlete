// core/condition-alignment/condition-alignment.service.ts

import { CONDITION_ALIGNMENT_WEIGHTS } from "./condition-alignment-weights.config";
import * as repo from "./condition-alignment.repository";
import * as brandRepository from "../brand/brand.repository";
import * as athleteRepository from "../athlete/athlete.repository";
import { AppError } from "../../../middleware/errorHandler";
import type {
  ConditionAlignmentResult,
  MatchedHealthCondition,
} from "./condition-alignment.types";

// ─────────────────────────────────────────────────────────────────────────────
// 1. LANGUAGE SCORE
// Brand ki language codes → athlete ke platform languages se match karo
// Match → full weight | No match → 0
// ─────────────────────────────────────────────────────────────────────────────
function calculateLanguageScore(
  brandLanguageCodes: string[],
  platformLinks: any[],
  weight: number
): { score: number; matched: boolean } {
  const athleteLanguages = new Set<string>();

  for (const link of platformLinks) {
    const raw = link.rawData;

    if (!raw) continue;

    // Instagram
    const igLangs: string[] = raw?.user?.blogger_languages ?? [];
    igLangs.forEach((l) => athleteLanguages.add(l.toLowerCase()));

    // YouTube
    const ytLangs: string[] =
      raw?.report?.features?.blogger_languages?.data ?? [];
    ytLangs.forEach((l) => athleteLanguages.add(l.toLowerCase()));

    // Twitter
    const twLangs: string[] =
      raw?.report?.features?.blogger_languages?.data ?? [];
    twLangs.forEach((l) => athleteLanguages.add(l.toLowerCase()));
  }

  const matched = brandLanguageCodes.some((code) =>
    athleteLanguages.has(code.toLowerCase())
  );

  return { score: matched ? weight : 0, matched };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CHANNEL SCORE
// Brand ka preferred channel → athlete ke synced platforms mein hai ya nahi
// Match → full weight | No match → 0
// ─────────────────────────────────────────────────────────────────────────────
function calculateChannelScore(
  brandPreferredChannels: string[],
  athleteSyncedPlatforms: string[],
  weight: number
): { score: number; matched: boolean } {
  const normalizedPreferred = brandPreferredChannels.map((c) =>
    c.toLowerCase()
  );
  const normalizedSynced = athleteSyncedPlatforms.map((p) => p.toLowerCase());
  const matched = normalizedPreferred.some((pref) =>
    normalizedSynced.includes(pref)
  );

  return { score: matched ? weight : 0, matched };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. HEALTH CONDITION SCORE
// Brand condition → resonance_conditions.keywords se match karo (name se nahi)
// Keywords match zyada reliable hai than direct name comparison
// ─────────────────────────────────────────────────────────────────────────────
async function calculateHealthConditionScore(
  brandHealthConditions: string[],
  athleteId: string,
  weight: number
): Promise<{ score: number; matched: MatchedHealthCondition[] }> {
  if (!brandHealthConditions.length) {
    return { score: 0, matched: [] };
  }

  const matched: MatchedHealthCondition[] = [];

  // Athlete ke saare resonance scores ek baar DB se lo (N+1 avoid)
  const athleteScores = await repo.findAllAthleteResonanceScores(athleteId);

  for (const brandCondition of brandHealthConditions) {
    const brandConditionLower = brandCondition.toLowerCase();

    for (const athleteScore of athleteScores) {
      const condition = athleteScore.resonanceCondition;
      if (!condition) continue;

      const keywords = (condition.keywords as string[]) ?? [];
      const matchedKeyword = keywords.find(
        (kw) =>
          kw.toLowerCase().includes(brandConditionLower) ||
          brandConditionLower.includes(kw.toLowerCase())
      );

      if (matchedKeyword) {
        matched.push({
          brandCondition,
          matchedKeyword,
          resonanceScore: athleteScore.score,
        });
      }
    }
  }

  if (!matched.length) return { score: 0, matched: [] };
  
  const conditionScores = brandHealthConditions.map((brandCondition) => {
    const relevantMatches = matched.filter(
      (m) => m.brandCondition === brandCondition
    );
    if (!relevantMatches.length) return 0;
    return Math.max(...relevantMatches.map((m) => m.resonanceScore));
  });

  const avgScore =
    conditionScores.reduce((sum, s) => sum + s, 0) / conditionScores.length;

  return {
    score: Math.round((avgScore / 100) * weight * 100) / 100,
    matched,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. HASHTAG SCORE
// Brand conditions ke DB hashtags → athlete ke platform hashtags se match
// Instagram: blogger_hashtags.performance.*[].text
// YouTube:   media[].features.hashtags[]
// Twitter:   blogger_hashtags.data.performance.*[] (mostly empty — handle gracefully)
// ─────────────────────────────────────────────────────────────────────────────
async function calculateHashtagScore(
  brandHealthConditions: string[],
  platformLinks: any[],
  weight: number
): Promise<{ score: number; matched: string[] }> {
  // Brand conditions ke saare hashtags DB se nikalo
  const allBrandHashtags = new Set<string>();

  for (const condition of brandHealthConditions) {
    const record = await repo.findResonanceConditionByName(condition);
    if (record?.hashtags) {
      (record.hashtags as string[]).forEach((h) =>
        allBrandHashtags.add(h.toLowerCase())
      );
    }
  }

  
  if (!allBrandHashtags.size) return { score: 0, matched: [] };

  // Athlete ke saare hashtags nikalo — teen platforms
  const athleteHashtags = new Set<string>();

  for (const link of platformLinks) {
    const raw = link.rawData;
    if (!raw) continue;

    if (link.platform === "instagram") {
      const perf = raw?.user?.blogger_hashtags?.performance ?? {};
      Object.values(perf).forEach((arr: any) => {
        (arr ?? []).forEach((h: any) => {
          if (h?.text) athleteHashtags.add(h.text.toLowerCase());
        });
      });
    }

    if (link.platform === "youtube") {
      const media: any[] = raw?.media ?? [];
      media.forEach((item) => {
        (item?.features?.hashtags ?? []).forEach((h: string) => {
          athleteHashtags.add(h.toLowerCase());
        });
      });
    }

    if (link.platform === "twitter") {
      // Twitter mostly empty hota hai but handle karo gracefully
      const perf =
        raw?.report?.features?.blogger_hashtags?.data?.performance ?? {};
      Object.values(perf).forEach((arr: any) => {
        (arr ?? []).forEach((h: any) => {
          const tag = typeof h === "string" ? h : h?.text;
          if (tag) athleteHashtags.add(tag.toLowerCase());
        });
      });
    }
  }

  const matched = [...allBrandHashtags].filter((h) => athleteHashtags.has(h));
  const matchRatio = matched.length / allBrandHashtags.size;

  return {
    score: Math.round(matchRatio * weight * 100) / 100,
    matched,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN FUNCTION — sab 4 scores combine karo
// ─────────────────────────────────────────────────────────────────────────────
export async function calculateConditionAlignmentScore(
  brandId: string,
  athleteId: string
): Promise<ConditionAlignmentResult> {
  const brand = await brandRepository.findBrandById(brandId);
  if (!brand) throw new AppError(404, "Brand not found");

  const athlete = await athleteRepository.findAthleteById(athleteId, true);
  if (!athlete) throw new AppError(404, "Athlete not found");

  const brandHealthConditions: string[] = brand.healthConditions.map(
    (item: any) => item.healthCondition.name
  );

  const brandLanguageCodes: string[] = brand.requiredLanguages.map(
    (item: any) => item.language.code
  );

  const brandPreferredChannels: string[] = brand.preferredChannels.map(
    (item: any) => item.channel.name
  );

  const platformLinks = athlete.platformLinks ?? [];
  const syncedPlatforms: string[] = platformLinks.map((l: any) => l.platform);

  // Parallel calculate karo jahan possible ho
  const [languageResult, channelResult, healthConditionResult, hashtagResult] =
    await Promise.all([
      Promise.resolve(
        calculateLanguageScore(
          brandLanguageCodes,
          platformLinks,
          CONDITION_ALIGNMENT_WEIGHTS.languageMatch
        )
      ),
      Promise.resolve(
        calculateChannelScore(
          brandPreferredChannels,
          syncedPlatforms,
          CONDITION_ALIGNMENT_WEIGHTS.channelMatch
        )
      ),
      calculateHealthConditionScore(
        brandHealthConditions,
        athlete.id,
        CONDITION_ALIGNMENT_WEIGHTS.healthConditionMatch
      ),
      calculateHashtagScore(
        brandHealthConditions,
        platformLinks,
        CONDITION_ALIGNMENT_WEIGHTS.hashtagMatch
      ),
    ]);

  const overallScore =
    languageResult.score +
    channelResult.score +
    healthConditionResult.score +
    hashtagResult.score;

  return {
    overallScore: Math.round(overallScore * 100) / 100,
    breakdown: {
      languageScore: languageResult.score,
      channelScore: channelResult.score,
      healthConditionScore: healthConditionResult.score,
      hashtagScore: hashtagResult.score,
    },
    details: {
      matchedLanguage: languageResult.matched,
      matchedChannel: channelResult.matched,
      matchedHealthConditions: healthConditionResult.matched,
      matchedHashtags: hashtagResult.matched,
    },
  };
}
