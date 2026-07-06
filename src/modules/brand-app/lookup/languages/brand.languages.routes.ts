import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";

const router = Router();
router.get(
  "/",
  async (_req, res, next) => {
    try {
      const results = await lookupService.getAthleteLanguages({
        isActive: true,
        fields: ["id", "name","code"],
      });

      res.json({
        success: true,
        message: "Languages fetched successfully",
        data: { languages: results },
      });
    } catch (err) {
      next(err);
    }
  }
);
export default router;