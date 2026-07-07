import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";
import { toNumber } from "../../../../utils/pagination.util";
import { createLanguageSchema, updateLanguageSchema } from "./admin.languages.schema";
import { validate } from "../../../../middleware/validate";

const router = Router();

router.post(
  "/",
  validate(createLanguageSchema),
  async (req, res, next) => {
    try {
      const result = await lookupService.createLanguage(req.body);

      res.status(201).json({
        success: true,
        message: "Language created successfully",
        data: {
          language: result,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/",
  async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10, isActive } = req.query;

      const results = await lookupService.getAthleteLanguages({
        search: search as string,
        page: toNumber(page),
        limit: toNumber(limit),
        isActive: isActive !== undefined ? isActive === "true" : undefined,
        fields: [
          "id",
          "name",
          "code",
          "isActive",
          "createdAt",
          "updatedAt",
        ],
      });
      res.json({
        success: true,
        message: "Languages fetched successfully",
        data:  results,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  validate(updateLanguageSchema),
  async (req, res, next) => {
    try {
      const language = await lookupService.updateAthleteLanguage( req.params.id,req.body);

      res.json({
        success: true,
        message: "Language updated successfully",
        data: {
          language,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);



router.delete("/:id", async (req, res, next) => {
  try {
    const result = await lookupService.deleteAthleteLanguage(req.params.id);

    res.json({
      success: true,
      message: "Language deleted successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;