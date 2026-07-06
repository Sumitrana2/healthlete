import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";

const router = Router();


router.get(
  "/search",
  async (req, res, next) => {
    try {
      const { search} = req.query;
      const results = await lookupService.getCompanies({
        search: search as string,
        fields: ["id", "name", "website"],
        includeIndustry: true,
        includeCompanySize: false,
      });
      res.json({
        success: true,
        message: "Companies fetched successfully",
        data: { companies: results },
      });
    } catch (err) {
      next(err);
    }
  }
);


export default router;