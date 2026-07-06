import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";
import { toNumber } from "../../../../utils/pagination.util";

const router = Router();
router.get(
  "/",
  async (req, res, next) => {
    try {
      const { search, page = 1, limit = 10, isActive } = req.query;

      const results = await lookupService.getAthleteLanguages({
        search: search as string,
        page: toNumber(page),
        limit: toNumber(limit),
        isActive: isActive !== undefined ? isActive === "true" : true,
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
        data: { languages: results },
      });
    } catch (err) {
      next(err);
    }
  }
);
export default router;