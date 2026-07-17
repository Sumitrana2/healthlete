import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { syncAthleteSchema, updateAthleteSchema } from "./admin.athlete.schema";
import { uploadSingleImage } from "../../../services/upload/upload.middleware";
import { buildFileResult, deleteUploadedFiles } from "../../../services/upload/upload.service";
import * as athleteService from "../../core/athletev1 copy/athlete.service";
import { toNumber } from "../../../utils/pagination-lookup.util";

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
router.post("/sync",
 validate(syncAthleteSchema, "body"), 
 async (req, res, next) => {
  try {
    
    const result = await athleteService.syncAthlete(req.body);
    res.status(201).json({
      success: true,
      message: "Athlete synced successfully",
      data: { result },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const { search, page, limit, isActive, healthConditionIds, includeHealthConditions } = req.query;
    const results = await athleteService.getAthletes({
      search: search as string,
      page: toNumber(page),
      limit: toNumber(limit),
      isActive: isActive !== undefined ? isActive === "true" : undefined,
      healthConditionIds: healthConditionIds ? (healthConditionIds as string).split(",") : undefined,
      includeHealthConditions: includeHealthConditions === "true",
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
  uploadSingleImage,
  validate(updateAthleteSchema, "body", true),
  async (req, res, next) => {
    try {
      const avatar = req.file ? buildFileResult(req.file, "athletes") : undefined;
      const result = await athleteService.updateAthlete(req.params.id, {
        ...req.body,
        ...(avatar && { avatarUrl: avatar.url }),
      });
      res.json({ success: true, message: "Athlete updated successfully", data: { result } });
    } catch (err) {
      await deleteUploadedFiles(req.file);
      next(err);
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    await athleteService.deleteAthlete(req.params.id);
    res.json({ success: true, message: "Athlete deleted successfully", data: null });
  } catch (err) {
    next(err);
  }
});

export default router;