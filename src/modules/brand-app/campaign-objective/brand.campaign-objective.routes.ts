import { Router } from "express";
import * as campaignObjectivesService from "./brand.campaign-objective.service";

const router = Router();
router.get(
  "/",
  async (_req, res, next) => {
    try {
      const results = await campaignObjectivesService.getCampaignObjectives();
      res.json({
        success: true,
        message: "Campaign objectives fetched successfully",
        data: { campaignObjectives: results },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;