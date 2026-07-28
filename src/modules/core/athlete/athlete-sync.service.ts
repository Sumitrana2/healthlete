import { AppError } from "../../../middleware/errorHandler";
import * as repository from "./athlete.repository";
import { AthletePlatformLink } from "./athlete.types";
import * as hyperAuditorClient from "../hyperauditor/hyperauditor.client";
import { enrichAthleteData } from "../ai/ai.client";

import { findOrCreateResonanceCondition } from "../resonance/resonance-condition.service";
import { extractTextFromRawData } from "../resonance/text-extractor";
import { calculateResonanceForCondition } from "../resonance/resonance-calculator";
import * as resonanceRepo from "../resonance/resonance-condition.repository";
import {
  normalizeInstagramMedia,
  normalizeYoutubeMedia,
  normalizeTwitterMedia,
  NormalizedMediaItem,
} from "./media-normalizer";
import {
  calculateCredibilityForPlatform,
  calculateOverallCredibility,
} from "../credibility/credibility.service";
import { calculateNormalizedWeights } from "../scoring/platform-weights.config";
import {
  calculateAudienceTrustForPlatform,
  calculateOverallAudienceTrust,
} from "../audience-trust/audience-trust.service";
// import {
//   calculateConditionAlignmentForPlatform,
//   calculateOverallConditionAlignment,
// } from "../condition-alignment/condition-alignment.service";

// export async function syncAthleteData(athleteId: string, provider: string) {
//   const athlete = await repository.findAthleteById(athleteId);
//   if (!athlete) throw new AppError(404, "Athlete not found");

//   const links = await repository.findAllPlatformLinksForAthleteByProvider(
//     athleteId,
//     provider
//   );

//   if (!links.length) {
//     throw new AppError(400, "No platform links found for this athlete");
//   }

//   const results = [];
//   const collectedUsernames: string[] = [];

//   try {
//     await repository.upsertAthleteProvider(athleteId, provider, "syncing");

//     // ── Step 1 — Har platform ka raw data fetch + save karo ──────────────────────
//     for (const link of links) {
//       try {
//         const normalized = await syncSinglePlatformLink(link);

//         await repository.updatePlatformLinkSyncData(link.id, {
//           rawData: normalized.raw,
//           profileUrl: normalized.profile_url ?? link.profileUrl,
//           reportState: "ready",
//           lastSyncedAt: new Date(),
//         });

//         if (link.username) collectedUsernames.push(link.username);

//         results.push({ platform: link.platform, status: "success" });
//       } catch (err) {
//         await repository
//           .updatePlatformLinkSyncData(link.id, {
//             rawData: null,
//             reportState: "failed",
//             lastSyncedAt: new Date(),
//           })
//           .catch(() => {});

//         results.push({
//           platform: link.platform,
//           status: "failed",
//           error: err instanceof Error ? err.message : "Unknown error",
//         });
//       }
//     }

//     try {
//       const aiResult = await enrichAthleteData({
//         fullName: athlete.fullName,
//         usernames: collectedUsernames,
//       });

//       console.log(aiResult.countryName, "aiResult.countryName");
//       const healthConditionTags = aiResult.healthConditions ?? [];

//       const resonanceConditionRecords = [];
//       for (const tag of healthConditionTags) {
//         const record = await findOrCreateResonanceCondition(tag);
//         resonanceConditionRecords.push(record);
//       }

//       const extractedTexts = links
//         .filter((link) => link.rawData)
//         .map((link) =>
//           extractTextFromRawData(link.provider, link.platform, link.rawData)
//         );

//       const resonanceScores = resonanceConditionRecords.map((condition) =>
//         calculateResonanceForCondition(
//           {
//             id: condition.id,
//             condition: condition.name,
//             keywords: (condition.keywords as string[]) ?? [],
//             hashtags: (condition.hashtags as string[]) ?? [],
//           },
//           extractedTexts
//         )
//       );

//       await resonanceRepo.saveAthleteResonanceScores(
//         athleteId,
//         resonanceScores
//       );

//       const resonanceSummary = await repository.getResonanceSummary(athleteId);

//       await repository.upsertAthleteFinalScore(athleteId, {
//         resonanceScore: resonanceSummary.averageScore,
//         scoreBreakdown: {
//           resonanceMax: resonanceSummary.maxScore,
//           resonanceMaxCondition: resonanceSummary.maxCondition,
//           resonanceDetails: resonanceSummary.breakdown,
//         },
//       });

//       await repository.updateAthleteAggregatedFields(athleteId, {
//         description: aiResult.description,
//         isDescriptionAdded: true,
//         country: aiResult.country,
//         countryName: aiResult.countryName,
//         gender: aiResult.gender,
//         languages: aiResult.languages ?? [],
//         categories: aiResult.categories ?? [],
//         healthConditions: aiResult.healthConditions ?? [],
//       });

//       results.push({ platform: "ai-enrichment", status: "success" });
//     } catch (aiErr) {

//       results.push({
//         platform: "ai-enrichment",
//         status: "failed",
//         error: aiErr instanceof Error ? aiErr.message : "AI enrichment failed",
//       });
//     }

//     // cred score
//     try {
//       const refreshedLinksForCred = await repository.findAllPlatformLinksForAthleteByProvider(
//         athleteId,
//         provider
//       );

//       const platformCredibilityResults = refreshedLinksForCred
//         .filter((link) => link.rawData)
//         .map((link) => calculateCredibilityForPlatform(link.platform, link.rawData))
//         .filter((r): r is NonNullable<typeof r> => r !== null);

//       const linkedPlatformNames = refreshedLinksForCred.map((l) => l.platform);
//       const normalizedWeights = calculateNormalizedWeights(linkedPlatformNames);

//       const { overallScore: overallCredibilityScore, breakdown: credibilityBreakdown } =
//         calculateOverallCredibility(platformCredibilityResults, normalizedWeights);

//       await repository.upsertAthleteFinalScore(athleteId, {
//         credibilityScore: overallCredibilityScore,
//         scoreBreakdown: {
//           credibility: credibilityBreakdown,
//         },
//       });

//       results.push({ platform: "credibility-calculation", status: "success" });
//     } catch (credErr) {
//       results.push({
//         platform: "credibility-calculation",
//         status: "failed",
//         error: credErr instanceof Error ? credErr.message : "Credibility calculation failed",
//       });
//     }
//     await repository.upsertAthleteProvider(athleteId, provider, "completed");
//   } catch (err) {
//     await repository.upsertAthleteProvider(athleteId, provider, "failed");
//   }

//   return results;
// }

// export async function syncAthleteData(athleteId: string, provider: string) {
//   const athlete = await repository.findAthleteById(athleteId);
//   if (!athlete) throw new AppError(404, "Athlete not found");

//   const links = await repository.findAllPlatformLinksForAthleteByProvider(
//     athleteId,
//     provider
//   );

//   if (!links.length) {
//     throw new AppError(400, "No platform links found for this athlete");
//   }

//   const results = [];
//   const collectedUsernames: string[] = [];

//   try {
//     await repository.upsertAthleteProvider(athleteId, provider, "syncing");

//     // ── Step 1 — Har platform ka raw data fetch + save karo ────────────────────
//     for (const link of links) {
//       try {
//         const normalized = await syncSinglePlatformLink(link);

//         await repository.updatePlatformLinkSyncData(link.id, {
//           rawData: normalized.raw,
//           profileUrl: normalized.profile_url ?? link.profileUrl,
//           reportState: "ready",
//           lastSyncedAt: new Date(),
//         });

//         if (link.username) collectedUsernames.push(link.username);
//         results.push({ platform: link.platform, status: "success" });
//       } catch (err) {
//         await repository
//           .updatePlatformLinkSyncData(link.id, {
//             rawData: null,
//             reportState: "failed",
//             lastSyncedAt: new Date(),
//           })
//           .catch(() => {});

//         results.push({
//           platform: link.platform,
//           status: "failed",
//           error: err instanceof Error ? err.message : "Unknown error",
//         });
//       }
//     }

//     // ── Step 2 — AI enrichment — SIRF PEHLI BAAR ────────────────────────────────
//       try {
//         const aiResult = await enrichAthleteData({
//           fullName: athlete.fullName,
//           usernames: collectedUsernames,
//         });

//         await repository.updateAthleteAggregatedFields(athleteId, {
//           description: aiResult.description,
//           isDescriptionAdded: true,
//           country: aiResult.country,
//           countryName: aiResult.countryName,
//           gender: aiResult.gender,
//           languages: aiResult.languages ?? [],
//           categories: aiResult.categories ?? [],
//           healthConditions: aiResult.healthConditions ?? [],
//         });

//         results.push({ platform: "ai-enrichment", status: "success" });
//       } catch (aiErr) {
//         results.push({
//           platform: "ai-enrichment",
//           status: "failed",
//           error: aiErr instanceof Error ? aiErr.message : "AI enrichment failed",
//         });
//       }

//     // ── Step 3 — Resonance calculate karo (hamesha, DB ke healthConditions se) ──
//     let resonanceScoreForFinal = 0;
//     let resonanceBreakdownForFinal: any = null;

//     try {
//       const refreshedAthlete = await repository.findAthleteById(athleteId);
//       const currentHealthConditions = (refreshedAthlete?.healthConditions as string[]) ?? [];

//       if (currentHealthConditions.length) {
//         await repository.deleteAthleteResonanceScores(athleteId);

//         const resonanceConditionRecords = [];
//         for (const tag of currentHealthConditions) {
//           const record = await findOrCreateResonanceCondition(tag);
//           resonanceConditionRecords.push(record);
//         }

//         const refreshedLinks = await repository.findAllPlatformLinksForAthleteByProvider(
//           athleteId,
//           provider
//         );

//         const extractedTexts = refreshedLinks
//           .filter((link) => link.rawData)
//           .map((link) =>
//             extractTextFromRawData(link.provider, link.platform, link.rawData)
//           );

//         const resonanceScores = resonanceConditionRecords.map((condition) =>
//           calculateResonanceForCondition(
//             {
//               id: condition.id,
//               condition: condition.name,
//               keywords: (condition.keywords as string[]) ?? [],
//               hashtags: (condition.hashtags as string[]) ?? [],
//             },
//             extractedTexts
//           )
//         );

//         await resonanceRepo.saveAthleteResonanceScores(athleteId, resonanceScores);

//         const resonanceSummary = await repository.getResonanceSummary(athleteId);
//         resonanceScoreForFinal = resonanceSummary.averageScore;
//         resonanceBreakdownForFinal = {
//           max: resonanceSummary.maxScore,
//           maxCondition: resonanceSummary.maxCondition,
//           details: resonanceSummary.breakdown,
//         };
//       }

//       results.push({ platform: "resonance-calculation", status: "success" });
//     } catch (resonanceErr) {
//       results.push({
//         platform: "resonance-calculation",
//         status: "failed",
//         error: resonanceErr instanceof Error ? resonanceErr.message : "Resonance calculation failed",
//       });
//     }

//     // ── Step 4 — Credibility calculate karo ─────────────────────────────────────
//     let credibilityScoreForFinal = 0;
//     let credibilityBreakdownForFinal: any = null;
//     let normalizedWeightsForFinal: Record<string, number> = {};

//     try {
//       const refreshedLinksForCred = await repository.findAllPlatformLinksForAthleteByProvider(
//         athleteId,
//         provider
//       );

//       const platformCredibilityResults = refreshedLinksForCred
//         .filter((link) => link.rawData)
//         .map((link) => calculateCredibilityForPlatform(link.platform, link.rawData))
//         .filter((r): r is NonNullable<typeof r> => r !== null);

//       const linkedPlatformNames = refreshedLinksForCred.map((l) => l.platform);
//       normalizedWeightsForFinal = calculateNormalizedWeights(linkedPlatformNames);

//       const { overallScore, breakdown } = calculateOverallCredibility(
//         platformCredibilityResults,
//         normalizedWeightsForFinal
//       );

//       credibilityScoreForFinal = overallScore;
//       credibilityBreakdownForFinal = breakdown;

//       results.push({ platform: "credibility-calculation", status: "success" });
//     } catch (credErr) {
//       results.push({
//         platform: "credibility-calculation",
//         status: "failed",
//         error: credErr instanceof Error ? credErr.message : "Credibility calculation failed",
//       });
//     }

//     // ── Step 5 — Sab kuch ek hi baar mein save karo (koi overwrite nahi hoga) ───
//     await repository.upsertAthleteFinalScore(athleteId, {
//       resonanceScore: resonanceScoreForFinal,
//       credibilityScore: credibilityScoreForFinal,
//       weightDistribution: normalizedWeightsForFinal,
//       scoreBreakdown: {
//         resonance: resonanceBreakdownForFinal,
//         credibility: credibilityBreakdownForFinal,
//       },
//     });

//     await repository.upsertAthleteProvider(athleteId, provider, "completed");
//   } catch (err) {
//     await repository.upsertAthleteProvider(athleteId, provider, "failed");
//   }

//   return results;
// }
export async function syncAthleteData(athleteId: string, provider: string) {
  const athlete = await repository.findAthleteById(athleteId);
  if (!athlete) throw new AppError(404, "Athlete not found");

  const links = await repository.findAllPlatformLinksForAthleteByProvider(
    athleteId,
    provider
  );

  if (!links.length) {
    throw new AppError(400, "No platform links found for this athlete");
  }

  const results = [];
  const collectedUsernames: string[] = [];

  try {
    await repository.upsertAthleteProvider(athleteId, provider, "syncing");

    // ── Step 1 — Har platform ka raw data fetch + save karo ────────────────────
    for (const link of links) {
      try {
        const normalized = await syncSinglePlatformLink(link);

        await repository.updatePlatformLinkSyncData(link.id, {
          rawData: normalized.raw,
          profileUrl: normalized.profile_url ?? link.profileUrl,
          reportState: "ready",
          lastSyncedAt: new Date(),
        });

        if (link.username) collectedUsernames.push(link.username);
        results.push({ platform: link.platform, status: "success" });
      } catch (err) {
        await repository
          .updatePlatformLinkSyncData(link.id, {
            rawData: null,
            reportState: "failed",
            lastSyncedAt: new Date(),
          })
          .catch(() => {});

        results.push({
          platform: link.platform,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // ── Step 2 — AI enrichment ──────────────────────────────────────────────────
    try {
      const aiResult = await enrichAthleteData({
        fullName: athlete.fullName,
        usernames: collectedUsernames,
      });

      await repository.updateAthleteAggregatedFields(athleteId, {
        description: aiResult.description,
        isDescriptionAdded: true,
        country: aiResult.country,
        countryName: aiResult.countryName,
        gender: aiResult.gender,
        languages: aiResult.languages ?? [],
        categories: aiResult.categories ?? [],
        healthConditions: aiResult.healthConditions ?? [],
      });

      results.push({ platform: "ai-enrichment", status: "success" });
    } catch (aiErr) {
      results.push({
        platform: "ai-enrichment",
        status: "failed",
        error: aiErr instanceof Error ? aiErr.message : "AI enrichment failed",
      });
    }

    // ── Step 3 — Resonance calculate karo (DB ke healthConditions se) ──────────
    let resonanceScoreForFinal = 0;
    let resonanceBreakdownForFinal: any = null;

    try {
      const refreshedAthlete = await repository.findAthleteById(athleteId);
      const currentHealthConditions =
        (refreshedAthlete?.healthConditions as string[]) ?? [];

      if (currentHealthConditions.length) {
        await repository.deleteAthleteResonanceScores(athleteId);

        const resonanceConditionRecords = [];
        for (const tag of currentHealthConditions) {
          const record = await findOrCreateResonanceCondition(tag);
          resonanceConditionRecords.push(record);
        }

        const refreshedLinks =
          await repository.findAllPlatformLinksForAthleteByProvider(
            athleteId,
            provider
          );

        const extractedTexts = refreshedLinks
          .filter((link) => link.rawData)
          .map((link) =>
            extractTextFromRawData(link.provider, link.platform, link.rawData)
          );

        const resonanceScores = resonanceConditionRecords.map((condition) =>
          calculateResonanceForCondition(
            {
              id: condition.id,
              condition: condition.name,
              keywords: (condition.keywords as string[]) ?? [],
              hashtags: (condition.hashtags as string[]) ?? [],
            },
            extractedTexts
          )
        );

        await resonanceRepo.saveAthleteResonanceScores(
          athleteId,
          resonanceScores
        );

        const resonanceSummary = await repository.getResonanceSummary(
          athleteId
        );
        resonanceScoreForFinal = resonanceSummary.averageScore;
        resonanceBreakdownForFinal = {
          max: resonanceSummary.maxScore,
          maxCondition: resonanceSummary.maxCondition,
          details: resonanceSummary.breakdown,
        };
      }

      results.push({ platform: "resonance-calculation", status: "success" });
    } catch (resonanceErr) {
      results.push({
        platform: "resonance-calculation",
        status: "failed",
        error:
          resonanceErr instanceof Error
            ? resonanceErr.message
            : "Resonance calculation failed",
      });
    }

    // ── Step 4 — Credibility calculate karo ─────────────────────────────────────
    let credibilityScoreForFinal = 0;
    let credibilityBreakdownForFinal: any = null;
    let normalizedWeightsForFinal: Record<string, number> = {};

    try {
      const refreshedLinksForCred =
        await repository.findAllPlatformLinksForAthleteByProvider(
          athleteId,
          provider
        );

      const platformCredibilityResults = refreshedLinksForCred
        .filter((link) => link.rawData)
        .map((link) =>
          calculateCredibilityForPlatform(link.platform, link.rawData)
        )
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const linkedPlatformNames = refreshedLinksForCred.map((l) => l.platform);
      normalizedWeightsForFinal =
        calculateNormalizedWeights(linkedPlatformNames);

      const { overallScore, breakdown } = calculateOverallCredibility(
        platformCredibilityResults,
        normalizedWeightsForFinal
      );

      credibilityScoreForFinal = overallScore;
      credibilityBreakdownForFinal = breakdown;

      results.push({ platform: "credibility-calculation", status: "success" });
    } catch (credErr) {
      results.push({
        platform: "credibility-calculation",
        status: "failed",
        error:
          credErr instanceof Error
            ? credErr.message
            : "Credibility calculation failed",
      });
    }

    // ── Step 6 — Audience Trust calculate karo ──────────────────────────────────
    let audienceTrustScoreForFinal = 0;
    let audienceTrustBreakdownForFinal: any = null;

    try {
      const refreshedLinksForTrust =
        await repository.findAllPlatformLinksForAthleteByProvider(
          athleteId,
          provider
        );

      const platformTrustResults = refreshedLinksForTrust
        .filter((link) => link.rawData)
        .map((link) =>
          calculateAudienceTrustForPlatform(link.platform, link.rawData)
        )
        .filter((r): r is NonNullable<typeof r> => r !== null);

      const linkedPlatformNamesForTrust = refreshedLinksForTrust.map(
        (l) => l.platform
      );
      const normalizedWeightsForTrust = calculateNormalizedWeights(
        linkedPlatformNamesForTrust
      );

      const { overallScore, breakdown } = calculateOverallAudienceTrust(
        platformTrustResults,
        normalizedWeightsForTrust
      );

      audienceTrustScoreForFinal = overallScore;
      audienceTrustBreakdownForFinal = breakdown;

      results.push({
        platform: "audience-trust-calculation",
        status: "success",
      });
    } catch (trustErr) {
      results.push({
        platform: "audience-trust-calculation",
        status: "failed",
        error:
          trustErr instanceof Error
            ? trustErr.message
            : "Audience trust calculation failed",
      });
    }

    // ── Step 7 — Condition Alignment calculate karo ──────────────────────────────
    let conditionAlignmentScoreForFinal = 0;
    let conditionAlignmentBreakdownForFinal: any = null;

    // try {
    //   // const brandProfile = await repository.findBrandProfile(brandId);
    //   // const brandProfile = {
    //   //   categories: [1041, 1003],
    //   //   keywords: ["breast cancer", "survivor", "recovery"],
    //   //   interests: ["health", "wellness", "fitness"],
    //   // };

    //   const brandProfile = {
    //     categories: [
    //       // Health Conditions
    //       1001, 1002, 1003, 1004, 1005,
    //       1006, 1007, 1008, 1009, 1010,
    //       1011, 1012, 1013, 1014, 1015,
    //       1016, 1017, 1018, 1019, 1020,
    //       1021, 1022, 1023, 1024, 1025,
    //       1026, 1027, 1028, 1029, 1030,
        
    //       2001, 2002, 2003, 2004, 2005,
    //       2006, 2007, 2008, 2009, 2010,
    //       2011, 2012, 2013, 2014, 2015,
    //       2016,
        
    //       3001, 3002, 3003, 3004, 3005,
    //       3006, 3007, 3008, 3009, 3010,
    //       3011, 3012, 3013, 3014, 3015
    //     ],
    //     keywords: [
    //       "breast cancer",
    //       "cancer survivor",
    //       "chemotherapy",
    //       "oncology",
    //       "mental health",
    //       "depression",
    //       "anxiety",
    //       "ptsd",
    //       "diabetes",
    //       "type 1 diabetes",
    //       "type 2 diabetes",
    //       "heart disease",
    //       "cardiac arrest",
    //       "stroke",
    //       "epilepsy",
    //       "autism",
    //       "adhd",
    //       "multiple sclerosis",
    //       "parkinson's disease",
    //       "als",
    //       "lupus",
    //       "crohn's disease",
    //       "colitis",
    //       "arthritis",
    //       "fibromyalgia",
    //       "endometriosis",
    //       "migraine",
    //       "chronic pain",
    //       "chronic illness",
    //       "rare disease",
    //       "organ donation",
    //       "kidney disease",
    //       "liver disease",
    //       "lung disease",
    //       "covid survivor",
    //       "long covid",
    //       "brain injury",
    //       "spinal cord injury",
    //       "amputee",
    //       "prosthetic",
    //       "disability",
    //       "wheelchair athlete",
    //       "blind athlete",
    //       "deaf athlete",
    //       "adaptive sports",
    //       "recovery",
    //       "rehabilitation",
    //       "physical therapy",
    //       "wellness",
    //       "fitness",
    //       "healthy lifestyle",
    //       "nutrition",
    //       "diet",
    //       "protein",
    //       "gym",
    //       "strength training",
    //       "weightlifting",
    //       "crossfit",
    //       "running",
    //       "marathon",
    //       "cycling",
    //       "triathlon",
    //       "yoga",
    //       "pilates",
    //       "meditation",
    //       "mindfulness",
    //       "sleep",
    //       "hydration",
    //       "performance",
    //       "sports medicine",
    //       "injury prevention",
    //       "motivation",
    //       "inspiration",
    //       "resilience",
    //       "perseverance",
    //       "health advocate",
    //       "patient advocate",
    //       "public speaker",
    //       "charity",
    //       "nonprofit",
    //       "fundraising",
    //       "community",
    //       "family",
    //       "parenting",
    //       "veteran",
    //       "military",
    //       "education",
    //       "awareness",
    //       "fundraiser",
    //       "inclusion",
    //       "diversity",
    //       "empowerment",
    //       "women's health",
    //       "men's health",
    //       "children's health",
    //       "caregiver",
    //       "mental wellness",
    //       "positive mindset",
    //       "hope",
    //       "survivor story",
    //       "life after cancer",
    //       "health campaign"
    //     ],
    //     interests: [
    //       "health",
    //       "wellness",
    //       "fitness",
    //       "sports",
    //       "nutrition",
    //       "running",
    //       "cycling",
    //       "weightlifting",
    //       "crossfit",
    //       "basketball",
    //       "football",
    //       "baseball",
    //       "soccer",
    //       "tennis",
    //       "golf",
    //       "swimming",
    //       "triathlon",
    //       "marathon",
    //       "olympics",
    //       "adaptive sports",
    //       "mental health",
    //       "public health",
    //       "health advocacy",
    //       "patient advocacy",
    //       "medical research",
    //       "charity",
    //       "fundraising",
    //       "volunteering",
    //       "community service",
    //       "motivation",
    //       "personal development",
    //       "mindfulness",
    //       "meditation",
    //       "yoga",
    //       "healthy eating",
    //       "meal prep",
    //       "supplements",
    //       "biohacking",
    //       "longevity",
    //       "recovery",
    //       "rehabilitation",
    //       "physical therapy",
    //       "family",
    //       "parenting",
    //       "education",
    //       "podcasts",
    //       "travel",
    //       "outdoors",
    //       "hiking",
    //       "camping"
    //     ]
    //   };
    //   const refreshedLinksForCA =
    //     await repository.findAllPlatformLinksForAthleteByProvider(
    //       athleteId,
    //       provider
    //     );

    //   const platformCAResults = refreshedLinksForCA
    //     .filter((link) => link.rawData)
    //     .map((link) =>
    //       calculateConditionAlignmentForPlatform(
    //         link.platform,
    //         link.rawData,
    //         brandProfile
    //       )
    //     )
    //     .filter((r): r is NonNullable<typeof r> => r !== null);

    //   const linkedPlatformNamesForCA = refreshedLinksForCA.map(
    //     (l) => l.platform
    //   );
    //   const normalizedWeightsForCA = calculateNormalizedWeights(
    //     linkedPlatformNamesForCA
    //   );

    //   const { overallScore, breakdown } = calculateOverallConditionAlignment(
    //     platformCAResults,
    //     normalizedWeightsForCA
    //   );

    //   conditionAlignmentScoreForFinal = overallScore;
    //   conditionAlignmentBreakdownForFinal = breakdown;

    //   results.push({
    //     platform: "condition-alignment-calculation",
    //     status: "success",
    //   });
    // } catch (caErr) {
    //   results.push({
    //     platform: "condition-alignment-calculation",
    //     status: "failed",
    //     error:
    //       caErr instanceof Error
    //         ? caErr.message
    //         : "Condition alignment calculation failed",
    //   });
    // }
    await repository.upsertAthleteFinalScore(athleteId, {
      resonanceScore: Math.round(resonanceScoreForFinal),
      credibilityScore: Math.round(credibilityScoreForFinal),
      audienceTrustScore: Math.round(audienceTrustScoreForFinal),
      conditionAlignmentScore: Math.round(conditionAlignmentScoreForFinal),
      weightDistribution: normalizedWeightsForFinal,
      scoreBreakdown: {
        resonance: resonanceBreakdownForFinal,
        credibility: credibilityBreakdownForFinal,
        audienceTrust: audienceTrustBreakdownForFinal,
        conditionAlignment: conditionAlignmentBreakdownForFinal,
      },
    });
    await repository.upsertAthleteProvider(athleteId, provider, "completed");
  } catch (err) {
    await repository.upsertAthleteProvider(athleteId, provider, "failed");
  }

  return results;
}

async function syncSinglePlatformLink(link: AthletePlatformLink) {
  if (!link.providerSocialId) {
    throw new AppError(400, `Missing provider social id for ${link.platform}`);
  }

  const mainReport = await fetchFromProvider(
    link.provider,
    link.platform,
    link.providerSocialId
  );
  const rawData = mainReport.raw as any;

  let mediaItems: NormalizedMediaItem[] = [];

  if (link.platform === "instagram" && link.username) {
    const mediaReport = await hyperAuditorClient.fetchInstagramMediaReport(
      link.username
    );
    mediaItems = normalizeInstagramMedia(mediaReport);
  } else if (link.platform === "youtube") {
    mediaItems = normalizeYoutubeMedia(rawData?.media ?? []);
  } else if (link.platform === "twitter") {
    mediaItems = normalizeTwitterMedia(rawData);
  }

  if (mediaItems.length) {
    await repository.upsertAthleteMedia(link.id, mediaItems);
  }

  mainReport.raw = {
    ...rawData,
    _extractedMedia: mediaItems,
  } as any;

  return mainReport;
}

async function fetchFromProvider(
  provider: string,
  platform: string,
  socialId: string
) {
  switch (provider) {
    case "hyperauditor":
      return fetchFromHyperAuditor(platform, socialId);
    default:
      throw new AppError(400, `Unsupported provider: ${provider}`);
  }
}

async function fetchFromHyperAuditor(platform: string, socialId: string) {
  switch (platform) {
    case "instagram":
      return hyperAuditorClient.fetchInstagramReport(socialId);
    case "youtube":
      return hyperAuditorClient.fetchYoutubeReport(socialId);
    case "twitter":
      return hyperAuditorClient.fetchTwitterReport(socialId);
    default:
      throw new AppError(
        400,
        `Unsupported platform for HyperAuditor: ${platform}`
      );
  }
}
