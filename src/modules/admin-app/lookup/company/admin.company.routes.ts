import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";
import { toNumber } from "../../../../utils/pagination.util";
import { validate } from "../../../../middleware/validate";
import { createCompanySchema, updateCompanySchema } from "./admin.company.schema";

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
      isActive: isActive !== undefined ? isActive === "true" : undefined,
      fields: ["id", "name", "website","isActive"],
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

router.patch(
  "/:id",
  validate(updateCompanySchema),
  async (req, res, next) => {
    try {
      const result = await lookupService.updateCompany(
        req.params.id,
        req.body
      );

      res.json({
        success: true,
        message: "Company updated successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await lookupService.deleteCompany(req.params.id);

    res.json({
      success: true,
      message: "Company deleted successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
export default router;
