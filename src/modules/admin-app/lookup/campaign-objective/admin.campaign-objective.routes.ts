import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";
import { toNumber } from "../../../../utils/pagination.util";
import { createCampaignObjectiveSchema } from "./admin.campaign-objective.schema";
import { validate } from "../../../../middleware/validate";
const router = Router();


router.post(
  "/",
  validate(createCampaignObjectiveSchema),
  async (req, res, next) => {
    try {
      const { name } = req.body;
      const result = await lookupService.createCampaignObjective({ name });
      res.status(201).json({
        success: true,
        message: "Campaign objective created successfully",
        data: { industry: result },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/", async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, isActive } = req.query;
    const results = await lookupService.getCampaignObjectives({
      search: search as string,
      page: toNumber(page),
      limit: toNumber(limit),
      isActive: isActive !== undefined ? isActive === "true" : true,
      fields: ["id", "name", "isActive", "createdAt", "updatedAt"],
    });
    res.json({
      success: true,
      message: "Campaign objectives fetched",
      data:  results,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
