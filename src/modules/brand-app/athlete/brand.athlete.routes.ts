import { Router } from "express";
import * as athleteServiceve from "../../core/athlete/athlete.service";
import { toNumber } from "../../../utils/pagination-lookup.util";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { search, page, limit} =
      req.query;

    const results = await athleteServiceve.getAthletes({
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
    const athlete = await athleteServiceve.getAthleteById(req.params.id);
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
