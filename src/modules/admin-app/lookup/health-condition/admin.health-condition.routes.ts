import { Router } from "express";
import * as healthConditionsService from "./admin.health-condition.service";

const router = Router();
router.get(
  "/",
  async (req, res, next) => {
    try {
      const results = await healthConditionsService.getHealthConditions();
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