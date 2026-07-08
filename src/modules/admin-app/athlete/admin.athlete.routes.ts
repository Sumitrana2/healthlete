// admin.athlete.routes.ts
import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { createAthleteSchema } from "./admin.athlete.schema";
import { uploadSingleImage } from "../../../services/upload/upload.middleware";
import {
  buildFileResult,
  deleteUploadedFiles,
} from "../../../services/upload/upload.service";
import { requireFile } from "../../../middleware/validateFile";
import * as athleteService from "./admin.athlete.service";

const router = Router();

router.post(
  "/",
  uploadSingleImage,
  requireFile("image"),
  validate(createAthleteSchema, "body", true),
  async (req, res, next) => {
    try {

      const avatar = req.file
        ? buildFileResult(req.file, "athletes")
        : null;

      const result= await athleteService.createAthlete({
        ...req.body,
        avatarUrl: avatar?.url ?? null,
      });

      res.status(201).json({
        success: true,
        message: "Athlete created successfully",
        data: {
          result,
        },
      });
    } catch (err) {
      await deleteUploadedFiles(req.file);
     
      next(err);
    }
  }
);

export default router;