import { Router } from "express";
import { validate } from "../../../middleware/validate";
import {
  createAthleteSchema,
  addPlatformSchema,
  updateAthleteSchema,
} from "./admin.athlete.schema";
import { uploadSingleImage } from "../../../services/upload/upload.middleware";
import { buildFileResult, deleteUploadedFiles } from "../../../services/upload/upload.service";
import * as athleteService from "../../core/athletev1/athlete.service";
import { toNumber } from "../../../utils/pagination-lookup.util";

const router = Router();

// ── Search HyperAudit ────────────────────────────────────────────────────────────
router.get("/search", async (req, res, next) => {
  try {
    const items = await athleteService.searchAthletes(req.query.query as string);
    res.json({
      success: true,
      message: "Profiles fetched successfully",
      data: { items },
    });
  } catch (err) {
    next(err);
  }
});

// ── Search existing athletes (duplicacy check) ──────────────────────────────────
router.get("/search-existing", async (req, res, next) => {
  try {
    const results = await athleteService.searchExistingAthletes(req.query.name as string);
    res.json({
      success: true,
      message: "Similar athletes fetched",
      data: { results },
    });
  } catch (err) {
    next(err);
  }
});

// ── Create new athlete with first platform ──────────────────────────────────────
router.post("/", validate(createAthleteSchema, "body", true), async (req, res, next) => {
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
});

// ── Add platform to existing athlete ────────────────────────────────────────────
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
// ── List ──────────────────────────────────────────────────────────────────────────
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
      includeProviders
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

// ── Get by ID ─────────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const athlete = await athleteService.getAthleteById(req.params.id);
    res.json({ success: true, message: "Athlete fetched", data: { athlete } });
  } catch (err) {
    next(err);
  }
});

// ── Update ──────────────────────────────────────────────────────────────────────────
router.patch(
  "/:id",
  validate(updateAthleteSchema, "body", true),
  async (req, res, next) => {
    try {
      const result = await athleteService.updateAthlete(req.params.id, req.body);
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

// ── Delete ──────────────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    await athleteService.deleteAthlete(req.params.id);
    res.json({ success: true, message: "Athlete deleted successfully", data: {} });
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
export default router;