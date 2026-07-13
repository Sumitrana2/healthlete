import { Router } from "express";
import { validate } from "../../../middleware/validate";
import {
  createAthleteSchema,
  updateAthleteSchema,
} from "./admin.athlete.schema";
import { uploadSingleImage } from "../../../services/upload/upload.middleware";
import {
  buildFileResult,
  deleteUploadedFiles,
} from "../../../services/upload/upload.service";
import { requireFile } from "../../../middleware/validateFile";
import * as athleteService from "../../core/athlete/athlete.service";
import { toNumber } from "../../../utils/pagination-lookup.util";

const router = Router();

router.post(
  "/",
  uploadSingleImage,
  requireFile("image"),
  validate(createAthleteSchema, "body", true),
  async (req, res, next) => {
    try {
      const avatar = req.file ? buildFileResult(req.file, "athletes") : null;

      const result = await athleteService.createAthlete({
        ...req.body,
        avatarUrl: avatar?.url ?? null,
      });

      res.status(201).json({
        success: true,
        message: "Athlete created successfully",
        data: { result },
      });
    } catch (err) {
      await deleteUploadedFiles(req.file);
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

router.patch(
  "/:id",
  uploadSingleImage,
  validate(updateAthleteSchema, "body", true),
  async (req, res, next) => {
    try {
      const avatar = req.file
        ? buildFileResult(req.file, "athletes")
        : undefined;

      const result = await athleteService.updateAthlete(req.params.id, {
        ...req.body,
        ...(avatar && { avatarUrl: avatar.url }),
      });

      res.json({
        success: true,
        message: "Athlete updated successfully",
        data: { result },
      });
    } catch (err) {
      await deleteUploadedFiles(req.file);
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
      data: null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
