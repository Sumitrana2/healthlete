
import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";

const router = Router();
router.get(
  "/",
  async (_req, res, next) => {
    try {
      const results = await lookupService.getIndustries({
        isActive: true,
        fields: ["id", "name"],
      });
      
      res.json({
        success: true,
        message: "Industries fetched successfully",
        data: { industries: results },
      });
    } catch (err) {
      next(err);
    }
  }
);
export default router;


