import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";
import { toNumber } from "../../../../utils/pagination.util";
import { createIndustrySchema, updateIndustrySchema } from "./admin.industries.schema";
import { validate } from "../../../../middleware/validate";
const router = Router();

router.post(
  "/",
  validate(createIndustrySchema),
  async (req, res, next) => {
    try {
      const { name } = req.body;
      const result = await lookupService.createIndustry({ name });
      res.status(201).json({
        success: true,
        message: "Industry created successfully",
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

    const results = await lookupService.getIndustries({
      search: search as string,
      page: toNumber(page),
      limit: toNumber(limit),
      isActive: isActive !== undefined ? isActive === "true" : true,
      fields: [
        "id",
        "name",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    });

    res.json({
      success: true,
      message: "Industries fetched successfully",
      data:   results ,
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:id",
  validate(updateIndustrySchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const industry = await lookupService.updateIndustry(id, { name });

      res.json({
        success: true,
        message: "Industry updated successfully",
        data: {
          industry,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await lookupService.deleteIndustry(req.params.id);

    res.json({
      success: true,
      message: "Industry deleted successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
