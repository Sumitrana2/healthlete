import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";


const router = Router();
router.get(
  "/",
  async (_req, res, next) => {
    try {
      const results = await lookupService.getHealthConditions({
        isActive: true,
        fields: ["id", "name"],
      });
      res.json({
        success: true,
        message: "Health conditions fetched successfully",
        data: { healthConditions: results },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;