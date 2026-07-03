import { Router } from "express";
import * as languagesService from "./admin.languages.service";

const router = Router();
router.get(
  "/",
  async (req, res, next) => {
    try {
      const results = await languagesService.getAthleteLanguages();
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