// core/audience-alignment/audience-alignment.service.ts

import {
    AUDIENCE_ALIGNMENT_DYNAMIC_WEIGHTS,
    AUDIENCE_ALIGNMENT_STATIC_WEIGHTS,
    AUDIENCE_ALIGNMENT_STATIC_CONFIG,
  } from "./audience-alignment-weights.config";
  import * as repo from "./audience-alignment.repository";
  import * as brandRepository from "../brand/brand.repository";
  import * as athleteRepository from "../athlete/athlete.repository";
  import { AppError } from "../../../middleware/errorHandler";
  import type {
    AudienceAlignmentInput,
    AudienceAlignmentResult,
  } from "./audience-alignment.types";
  
  function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DYNAMIC 1 — LANGUAGE MATCH (20 pts)
  // Brand language → athlete ke audience languages se match
  // Instagram: result.user.audience_languages[].code
  // YouTube:   result.report.features.audience_languages.data[].title
  // Twitter:   available nahi — skip
  // ─────────────────────────────────────────────────────────────────────────────
  function calculateLanguageScore(
    brandLanguageCodes: string[],
    platformLinks: any[],
    weight: number
  ): { score: number; matched: boolean } {
    const audienceLanguages = new Set<string>();
  
    for (const link of platformLinks) {

      const raw = link.rawData;
      if (!raw) continue;
  
      if (link.platform == "instagram") {        
        // result.user.audience_languages[].code
        const langs: { code: string; value: number }[] =
          raw?.user?.audience_languages ?? [];
        langs.forEach((l) => audienceLanguages.add(l.code.toLowerCase()));
      }
  
      if (link.platform == "youtube") {
        // result.report.features.audience_languages.data[].title
        const langs: { title: string; prc: number }[] =
          raw?.report?.features?.audience_languages?.data ?? [];
        langs.forEach((l) => audienceLanguages.add(l.title.toLowerCase()));
      }
  
      // Twitter — audience language data available nahi, skip
    }
      
    const matched = brandLanguageCodes.some((code) =>
      audienceLanguages.has(code.toLowerCase())
    );
  
    return { score: matched ? weight : 0, matched };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // DYNAMIC 2 — HEALTH CONDITION MATCH (20 pts)
  // Same logic as condition alignment — resonance_conditions.keywords se match
  // ─────────────────────────────────────────────────────────────────────────────
  async function calculateHealthConditionScore(
    brandHealthConditions: string[],
    athleteId: string,
    weight: number
  ): Promise<{ score: number; matched: string[] }> {
    if (!brandHealthConditions.length) {
      return { score: 0, matched: [] };
    }
  
    const athleteScores = await repo.findAllAthleteResonanceScores(athleteId);
    console.log(brandHealthConditions,"brandHealthConditions");
    
    const matched: string[] = [];
  
    for (const brandCondition of brandHealthConditions) {
      const brandConditionLower = brandCondition.toLowerCase();
  
      for (const athleteScore of athleteScores) {
        const condition = athleteScore.resonanceCondition;
        if (!condition) continue;
  
        const keywords = (condition.keywords as string[]) ?? [];
  
        const isMatch = keywords.some(
          (kw) =>
            kw.toLowerCase().includes(brandConditionLower) ||
            brandConditionLower.includes(kw.toLowerCase())
        );
  
        if (isMatch && !matched.includes(brandCondition)) {
          matched.push(brandCondition);
        }
      }
    }
  
    // Kitne conditions match hue / total brand conditions
    const matchRatio = matched.length / brandHealthConditions.length;
    const score = Math.round(matchRatio * weight * 100) / 100;
  
    return { score, matched };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STATIC 1 — AGE RANGE MATCH (20 pts)
  // Brand age range mein kitna % audience fall karta hai
  // Instagram: result.user.demography_by_age[].by_age_group[].group + value
  // YouTube:   result.report.features.audience_age_gender.data (keys: "18-24" etc)
  // Twitter:   available nahi — skip
  // ─────────────────────────────────────────────────────────────────────────────
  function calculateAgeRangeScore(
    platformLinks: any[],
    ageConfig: { min: number; max: number },
    weight: number
  ): { score: number; audienceAgeInRange: number } {
    const agePercentages: number[] = [];
  
    for (const link of platformLinks) {
      const raw = link.rawData;
      if (!raw) continue;
  
      if (link.platform === "instagram") {
        console.log( raw.user.demography_by_age,"raw?.user?.demography_by_age");
        
        // demography_by_age → by_age_group[].group ("age18-24") + value (%)
        const demography: any[] = raw?.user?.demography_by_age ?? [];
  
        let inRangePct = 0;
        for (const genderGroup of demography) {
          for (const ageGroup of genderGroup.by_age_group ?? []) {
            // group format: "age13-17", "age18-24", "age25-34", "age65-"
            const range = ageGroup.group
              .replace("age", "")
              .replace("-", " ")
              .trim();
  
            const [minStr, maxStr] = ageGroup.group
              .replace("age", "")
              .split("-");
  
            const groupMin = parseInt(minStr) || 0;
            const groupMax = maxStr === "" ? 999 : parseInt(maxStr) || 999;
  
            // Overlap check — brand range aur group range overlap karte hain?
            const overlaps =
              groupMin <= ageConfig.max && groupMax >= ageConfig.min;
  
            if (overlaps) {
              inRangePct += ageGroup.value ?? 0;
            }
          }
        }
  
        agePercentages.push(inRangePct);
      }
  
      if (link.platform === "youtube") {
        // audience_age_gender.data keys: "13-17", "18-24", "25-34"...
        // each key has { male: %, female: % }
        const ageGender =
          raw?.report?.features?.audience_age_gender?.data ?? {};
  
        let inRangePct = 0;
        for (const [ageKey, genderData] of Object.entries(ageGender)) {
          const [minStr, maxStr] = ageKey.split("-");
          const groupMin = parseInt(minStr) || 0;
          const groupMax =
            maxStr === "+" || maxStr === undefined
              ? 999
              : parseInt(maxStr) || 999;
  
          const overlaps =
            groupMin <= ageConfig.max && groupMax >= ageConfig.min;
  
          if (overlaps) {
            const gd = genderData as { male: number; female: number };
            inRangePct += (gd.male ?? 0) + (gd.female ?? 0);
          }
        }
  
        agePercentages.push(inRangePct);
      }
  
      // Twitter — age data available nahi, skip
    }
  
    if (!agePercentages.length) {
      return { score: 0, audienceAgeInRange: 0 };
    }
  
    // Multiple platforms ka average lo
    const avgInRange =
      agePercentages.reduce((sum, p) => sum + p, 0) / agePercentages.length;
  
    // Scale: 100% in range = full weight
    const score = Math.round(clamp(avgInRange / 100, 0, 1) * weight * 100) / 100;
  
    return { score, audienceAgeInRange: Math.round(avgInRange * 100) / 100 };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STATIC 2 — COUNTRY MATCH (20 pts)
  // Default: US. Athlete ke audience mein US ka % dekho
  // Instagram: result.user.audience_geography.countries[].code
  // YouTube:   result.report.features.audience_geo.data[].title (2-letter code)
  // Twitter:   available nahi — skip
  // ─────────────────────────────────────────────────────────────────────────────
  function calculateCountryScore(
    platformLinks: any[],
    targetCountries: string[],
    weight: number
  ): { score: number; matched: boolean } {
    const countryPercentages: number[] = [];
    const normalizedTargets = targetCountries.map((c) => c.toLowerCase());
  
    for (const link of platformLinks) {
      const raw = link.rawData;
      if (!raw) continue;
  
      if (link.platform === "instagram") {
        // audience_geography.countries[].code (uppercase: "US")
        const countries: { name: string; code: string; value: number }[] =
          raw?.user?.audience_geography?.countries ?? [];
  
        const matchPct = countries
          .filter((c) => normalizedTargets.includes(c.code.toLowerCase()))
          .reduce((sum, c) => sum + (c.value ?? 0), 0);
  
        countryPercentages.push(matchPct);
      }
  
      if (link.platform === "youtube") {
        // audience_geo.data[].title (lowercase: "us")
        const geoData: { title: string; prc: number }[] =
          raw?.report?.features?.audience_geo?.data ?? [];
  
        const matchPct = geoData
          .filter((g) => normalizedTargets.includes(g.title.toLowerCase()))
          .reduce((sum, g) => sum + (g.prc ?? 0), 0);
  
        countryPercentages.push(matchPct);
      }
  
      // Twitter — country data available nahi, skip
    }
  
    if (!countryPercentages.length) {
      return { score: 0, matched: false };
    }
  
    const avgPct =
      countryPercentages.reduce((sum, p) => sum + p, 0) / countryPercentages.length;
  
    // 50%+ audience in target country = full marks
    const score =
      Math.round(clamp(avgPct / 50, 0, 1) * weight * 100) / 100;
  
    return { score, matched: avgPct > 0 };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STATIC 3 — POSITIVE SENTIMENT (12 pts)
  // Minimum positiveSentimentMin% positive comments chahiye
  // Instagram: result.user.audience_sentiments.sentiments.POSITIVE.prc
  // YouTube:   result.report.features.audience_sentiments.data.sentiments.POSITIVE.prc
  // Twitter:   available nahi — skip
  // ─────────────────────────────────────────────────────────────────────────────
  function calculateSentimentScore(
    platformLinks: any[],
    positiveSentimentMin: number,
    weight: number
  ): { score: number; positiveSentimentPct: number } {
    const sentimentValues: number[] = [];
  
    for (const link of platformLinks) {
      const raw = link.rawData;
      if (!raw) continue;
  
      if (link.platform === "instagram") {
        const prc =
          raw?.user?.audience_sentiments?.sentiments?.POSITIVE?.prc ?? null;
        if (prc !== null) sentimentValues.push(prc);
      }
  
      if (link.platform === "youtube") {
        const prc =
          raw?.report?.features?.audience_sentiments?.data?.sentiments?.POSITIVE
            ?.prc ?? null;
        if (prc !== null) sentimentValues.push(prc);
      }
  
      // Twitter — sentiment data available nahi, skip
    }
  
    if (!sentimentValues.length) {
      return { score: 0, positiveSentimentPct: 0 };
    }
  
    const avgSentiment =
      sentimentValues.reduce((sum, v) => sum + v, 0) / sentimentValues.length;
  
    // positiveSentimentMin se upar hai toh full marks
    // niche hai toh proportional score
    const score =
      avgSentiment >= positiveSentimentMin
        ? weight
        : Math.round((avgSentiment / positiveSentimentMin) * weight * 100) / 100;
  
    return {
      score: clamp(score, 0, weight),
      positiveSentimentPct: Math.round(avgSentiment * 100) / 100,
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // STATIC 4 — BLOGGER REACH (8 pts)
  // Minimum reach threshold cross karta hai?
  // Instagram: result.user.blogger_reach.reach
  // YouTube:   result.report.features.blogger_reach.data.reach
  // Twitter:   available nahi — skip
  // ─────────────────────────────────────────────────────────────────────────────
  function calculateBloggerReachScore(
    platformLinks: any[],
    bloggerReachMin: number,
    weight: number
  ): { score: number; bloggerReach: number } {
    const reachValues: number[] = [];
  
    for (const link of platformLinks) {
      const raw = link.rawData;
      if (!raw) continue;
  
      if (link.platform === "instagram") {
        const reach = raw?.user?.blogger_reach?.reach ?? null;
        if (reach !== null) reachValues.push(reach);
      }
  
      if (link.platform === "youtube") {
        const reach = raw?.report?.features?.blogger_reach?.data?.reach ?? null;
        if (reach !== null) reachValues.push(reach);
      }
  
      // Twitter — reach data available nahi, skip
    }
  
    if (!reachValues.length) {
      return { score: 0, bloggerReach: 0 };
    }
  
    // Best platform ka reach lo (max)
    const maxReach = Math.max(...reachValues);
  
    // bloggerReachMin cross kiya → full marks
    // nahi kiya → proportional
    const score =
      maxReach >= bloggerReachMin
        ? weight
        : Math.round((maxReach / bloggerReachMin) * weight * 100) / 100;
  
    return {
      score: clamp(score, 0, weight),
      bloggerReach: maxReach,
    };
  }
  
  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN — sab factors combine karo
  // ─────────────────────────────────────────────────────────────────────────────
  export async function calculateAudienceAlignmentScore(
    brandId: string,
    athleteId: string
  ): Promise<AudienceAlignmentResult> {
    const brand = await brandRepository.findBrandById(brandId);
    if (!brand) throw new AppError(404, "Brand not found");
  
    const athlete = await athleteRepository.findAthleteById(athleteId, true);
    if (!athlete) throw new AppError(404, "Athlete not found");
  
    // Brand dynamic inputs
    const brandLanguageCodes: string[] = brand.requiredLanguages.map(
      (item: any) => item.language.code
    );
    const brandHealthConditions: string[] = brand.healthConditions.map(
      (item: any) => item.healthCondition.name
    );
  
    const platformLinks = athlete.platformLinks ?? [];
  
    // Static config
    const { age, countries, positiveSentimentMin, bloggerReachMin } =
      AUDIENCE_ALIGNMENT_STATIC_CONFIG;
  
    // Sab calculate karo — parallel jahan possible
    const [languageResult, healthConditionResult] = await Promise.all([
      Promise.resolve(
        calculateLanguageScore(
          brandLanguageCodes,
          platformLinks,
          AUDIENCE_ALIGNMENT_DYNAMIC_WEIGHTS.languageMatch
        )
      ),
      calculateHealthConditionScore(
        brandHealthConditions,
        athlete.id,
        AUDIENCE_ALIGNMENT_DYNAMIC_WEIGHTS.healthConditionMatch
      ),
    ]);
  
    // Static scores — sync hain
    const ageResult = calculateAgeRangeScore(
      platformLinks,
      age,
      AUDIENCE_ALIGNMENT_STATIC_WEIGHTS.ageRangeMatch
    );
  
    const countryResult = calculateCountryScore(
      platformLinks,
      countries,
      AUDIENCE_ALIGNMENT_STATIC_WEIGHTS.countryMatch
    );
  
    const sentimentResult = calculateSentimentScore(
      platformLinks,
      positiveSentimentMin,
      AUDIENCE_ALIGNMENT_STATIC_WEIGHTS.positiveSentiment
    );
  
    const reachResult = calculateBloggerReachScore(
      platformLinks,
      bloggerReachMin,
      AUDIENCE_ALIGNMENT_STATIC_WEIGHTS.bloggerReach
    );
  
    const overallScore =
      languageResult.score +
      healthConditionResult.score +
      ageResult.score +
      countryResult.score +
      sentimentResult.score +
      reachResult.score;
  
    return {
      overallScore: Math.round(overallScore * 100) / 100,
      breakdown: {
        languageScore: languageResult.score,
        healthConditionScore: healthConditionResult.score,
        ageRangeScore: ageResult.score,
        countryScore: countryResult.score,
        positiveSentimentScore: sentimentResult.score,
        bloggerReachScore: reachResult.score,
      },
      details: {
        matchedLanguage: languageResult.matched,
        matchedHealthConditions: healthConditionResult.matched,
        audienceAgeInRange: ageResult.audienceAgeInRange,
        matchedCountry: countryResult.matched,
        positiveSentimentPct: sentimentResult.positiveSentimentPct,
        bloggerReach: reachResult.bloggerReach,
      },
    };
  }