import { Router } from "express";
import * as industriesService from "./brand.industries.service";

const router = Router();
router.get(
  "/",
  async (req, res, next) => {
    try {
      const results = await industriesService.getIndustries();
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