import { Router } from "express";
import * as athleteService from "../../core/athlete/athlete.service";
import { toNumber } from "../../../utils/pagination-lookup.util";
import * as conditionAlignmentService from "../../core/condition-alignment/condition-alignment.service";
import { calculateMatchScore } from "../../core/scoring/healthlete-match-score";
import * as audienceAlignmentService  from "../../core/audience-alignment/audience-alignment.service";

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
router.get("/:id", async (req, res, next) => {
  try {
    const athlete = await athleteService.getAthleteById(req.params.id);

    const [conditionAlignmentResult, audienceAlignmentResult] =
      await Promise.all([
        conditionAlignmentService.calculateConditionAlignmentScore(
          req?.brand?.id || "",
          req.params.id
        ),
        audienceAlignmentService.calculateAudienceAlignmentScore(
          req?.brand?.id || "",
          req.params.id
        ),
      ]);
 

    const healthleteMatchScore = calculateMatchScore(
      athlete.finalScore,
      conditionAlignmentResult.overallScore
    );

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
            audienceAlignmentScore: audienceAlignmentResult,
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



export default router;
