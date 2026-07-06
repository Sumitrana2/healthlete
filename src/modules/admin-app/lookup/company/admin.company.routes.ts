import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";
import { toNumber } from "../../../../utils/pagination.util";
import { validate } from "../../../../middleware/validate";
import { createCompanySchema } from "./admin.company.schema";

const router = Router();

router.post(
  "/",
  validate(createCompanySchema),
  async (req, res, next) => {
    try {
      const { name, website, industryId } = req.body;

      const company = await lookupService.createCompany({
        name,
        website,
        industryId,
      });

      res.status(201).json({
        success: true,
        message: "Company created successfully",
        data: { company },
      });
    } catch (err) {
      next(err);
    }
  }
);

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
      data:  results ,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
