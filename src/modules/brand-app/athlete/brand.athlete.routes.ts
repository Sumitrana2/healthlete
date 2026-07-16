import { Router } from "express";
import * as athleteService from "../../core/athlete/athlete.service";
import { toNumber } from "../../../utils/pagination-lookup.util";

const router = Router();


router.get("/", async (req, res, next) => {
  try {
    const {
      search,
      page,
      limit,
      healthConditionIds,
      includeHealthConditions,
    } = req.query;

    const results = await athleteService.getAthletes({
      search: search as string,
      page: toNumber(page),
      limit: toNumber(limit),
      isActive: true,
      healthConditionIds: healthConditionIds
        ? (healthConditionIds as string).split(",")
        : undefined,
      includeHealthConditions: includeHealthConditions === "true",
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
    res.json({
      success: true,
      message: "Athlete fetched",
      data: { athlete },
    });
  } catch (err) {
    next(err);
  }
});



export default router;