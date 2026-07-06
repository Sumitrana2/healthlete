import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";
import { toNumber } from "../../../../utils/pagination.util";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10, isActive } = req.query;

    const results = await lookupService.getCompanies({
      search: search as string,
      page: toNumber(page),
      limit: toNumber(limit),
      // isActive: isActive !== undefined ? isActive === "true" : true,
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
});

export default router;
