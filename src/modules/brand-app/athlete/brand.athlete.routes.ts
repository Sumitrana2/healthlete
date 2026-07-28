import { Router } from "express";
import * as athleteService from "../../core/athlete/athlete.service";
import { toNumber } from "../../../utils/pagination-lookup.util";
import * as conditionAlignmentService from "../../core/condition-alignment/condition-alignment.service";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { search, page, limit } = req.query;

    const results = await athleteService.getAthletes({
      search: search as string,
      page: toNumber(page),
      limit: toNumber(limit),
      isActive: true,
      includePlatformLinks: false,
      includeProviders: false,
      syncStatus: ["completed", "failed"],
    });

    res.json({
      success: true,
      message: "Athletes fetched",
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

// router.get("/:id", async (req, res, next) => {
//   try {
//     const athlete = await athleteServiceve.getAthleteById(req.params.id);
//     const score = await conditionAlignmentService.calculateConditionAlignmentScore(
//       req?.brand?.id || "",
//       req.params.id
//     );
//     // req.brand?.id
//     res.json({
//       success: true,
//       message: "Athlete fetched",
//       data: {score },
//     });
//   } catch (err) {
//     next(err);
//   }
// });
// router.get("/:id", async (req, res, next) => {
//   try {
//     const athlete = await athleteService.getAthleteById(req.params.id);
    
//     // Runtime condition alignment score calculate karo
//     const conditionAlignmentScore = await conditionAlignmentService
//       .calculateConditionAlignmentScore(
//         req?.brand?.id || "",
//         req.params.id
//       );

//     // finalScore mein runtime score merge karo
//     const enrichedAthlete = {
//       ...athlete,
//       finalScore: athlete.finalScore
//         ? {
//             ...athlete.finalScore,
//             // Runtime calculated score override karo
//             conditionAlignmentScore: conditionAlignmentScore.overallScore,
//             // Breakdown bhi add karo — UI ke liye useful hoga
//             scoreBreakdown: {
//               ...athlete.finalScore.scoreBreakdown,
//               conditionAlignment: {
//                 overallScore: conditionAlignmentScore.overallScore,
//                 breakdown: conditionAlignmentScore.breakdown,
//                 details: conditionAlignmentScore.details,
//               },
//             },
//           }
//         : null,
//     };

//     res.json({
//       success: true,
//       message: "Athlete fetched",
//       data: { athlete: enrichedAthlete },
//     });
//   } catch (err) {
//     next(err);
//   }
// });

router.get("/:id", async (req, res, next) => {
  try {
    const athlete = await athleteService.getAthleteById(req.params.id);

    const conditionAlignmentResult = await conditionAlignmentService
      .calculateConditionAlignmentScore(
        req?.brand?.id || "",
        req.params.id
      );

    const healthleteMatchScore = calculateMatchScore(
      athlete.finalScore,
      conditionAlignmentResult.overallScore
    );

    // scoreBreakdown JSON type hai DB mein — pehle cast karo
    const existingBreakdown =
      typeof athlete.finalScore?.scoreBreakdown === "object" &&
      athlete.finalScore?.scoreBreakdown !== null
        ? (athlete.finalScore.scoreBreakdown as Record<string, any>)
        : {};

    const enrichedAthlete = {
      ...athlete,
      finalScore: athlete.finalScore
        ? {
            ...athlete.finalScore,
            conditionAlignmentScore: Math.round(conditionAlignmentResult.overallScore),
            healthleteMatchScore,
            scoreBreakdown: {
              ...existingBreakdown,
              conditionAlignment: {
                overallScore: conditionAlignmentResult.overallScore,
                breakdown: conditionAlignmentResult.breakdown,
                details: conditionAlignmentResult.details,
              },
            },
          }
        : null,
    };

    res.json({
      success: true,
      message: "Athlete fetched",
      data: { athlete: enrichedAthlete },
    });
  } catch (err) {
    next(err);
  }
});

const MATCH_WEIGHTS = {
  conditionAlignment: 0.25,
  credibility: 0.25,
  audienceTrust: 0.25,
  resonance: 0.25,
};

function calculateMatchScore(
  finalScore: any,
  conditionAlignmentScore: number
): number {
  if (!finalScore) return 0;

  const score =
    conditionAlignmentScore * MATCH_WEIGHTS.conditionAlignment +
    (finalScore.credibilityScore ?? 0) * MATCH_WEIGHTS.credibility +
    (finalScore.audienceTrustScore ?? 0) * MATCH_WEIGHTS.audienceTrust +
    (finalScore.resonanceScore ?? 0) * MATCH_WEIGHTS.resonance;

  return Math.round(score * 100) / 100;
}
export default router;
