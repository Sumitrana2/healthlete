import { Router } from "express";
import { validate } from "../../../middleware/validate";
import {
  createAthleteSchema,
  addPlatformSchema,
  updateAthleteSchema,
  syncAthleteDataSchema,
} from "./admin.athlete.schema";
import * as athleteService from "../../core/athlete/athlete.service";
import { toNumber } from "../../../utils/pagination-lookup.util";
import * as athleteSyncService from "../../core/athlete/athlete-sync.service";

const router = Router();

router.get("/search", async (req, res, next) => {
  try {
    const items = await athleteService.searchAthletes(
      req.query.query as string
    );
    res.json({
      success: true,
      message: "Profiles fetched successfully",
      data: { items },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/search-existing", async (req, res, next) => {
  try {
    const results = await athleteService.searchExistingAthletes(
      req.query.name as string
    );
    res.json({
      success: true,
      message: "Similar athletes fetched",
      data: { results },
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/",
  validate(createAthleteSchema, "body", true),
  async (req, res, next) => {
    try {
      const result = await athleteService.createAthleteWithPlatform(req.body);

      res.status(result.requiresConfirmation ? 200 : 201).json({
        success: true,
        message: result.requiresConfirmation
          ? "Similar athlete found. Confirm to create new or add to existing."
          : "Athlete created successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/platforms",
  validate(addPlatformSchema, "body", true),
  async (req, res, next) => {
    try {
      const result = await athleteService.addPlatformToAthlete({
        athleteId: req.params.id,
        ...req.body,
      });
      res.status(201).json({
        success: true,
        message: "Platform added successfully",
        data: { result },
      });
    } catch (err) {
      next(err);
    }
  }
);
router.get("/", async (req, res, next) => {
  try {
    const {
      search,
      page,
      limit,
      isActive,
      healthConditionIds,
      includeHealthConditions,
      includePlatformLinks,
      includeProviders,
    } = req.query;

    const results = await athleteService.getAthletes({
      search: search as string,
      page: toNumber(page),
      limit: toNumber(limit),
      isActive: isActive !== undefined ? isActive === "true" : undefined,
      healthConditionIds: healthConditionIds
        ? (healthConditionIds as string).split(",")
        : undefined,
      includeHealthConditions: includeHealthConditions === "true",
      includePlatformLinks: includePlatformLinks === "true",
      includeProviders: includeProviders === "true",
    });

    res.json({ success: true, message: "Athletes fetched", data: results });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const athlete = await athleteService.getAthleteById(req.params.id);
    res.json({ success: true, message: "Athlete fetched", data: { athlete } });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:id",
  validate(updateAthleteSchema, "body", true),
  async (req, res, next) => {
    try {
      const result = await athleteService.updateAthlete(
        req.params.id,
        req.body
      );
      res.json({
        success: true,
        message: "Athlete updated successfully",
        data: { result },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    await athleteService.deleteAthlete(req.params.id);
    res.json({
      success: true,
      message: "Athlete deleted successfully",
      data: {},
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/platforms/:linkId", async (req, res, next) => {
  try {
    await athleteService.deletePlatform(req.params.id, req.params.linkId);
    res.json({
      success: true,
      message: "Platform removed successfully",
      data: {},
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/:id/sync-data",
  validate(syncAthleteDataSchema, "body", true),
  async (req, res, next) => {
    try {
      const { provider } = req.body;
      const results = await athleteSyncService.syncAthleteData(
        req.params.id,
        provider
      );
      res.json({
        success: true,
        message: "Athlete data sync completed",
        data: { results },
      });
    } catch (err) {
      next(err);
    }
  }
);
export default router;
