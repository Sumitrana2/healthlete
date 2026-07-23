import { Router } from "express";
import { validate } from "../../../middleware/validate";
import { updateBrandStatusSchema } from "./admin.brand.schema";
import * as brandService from "../../core/brand/brand.service";
import { toNumber } from "../../../utils/pagination-lookup.util";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { search, isActive, approvalStatus, companyId, industryId, page, limit } = req.query;

    const results = await brandService.getBrands({
      search: search as string,
      isActive: isActive !== undefined ? isActive === "true" : undefined,
      approvalStatus: approvalStatus as any,
      companyId: companyId as string,
      industryId: industryId as string,
      page: toNumber(page),
      limit: toNumber(limit),
    });

    res.json({ success: true, message: "Brands fetched", data: results });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const brand = await brandService.getBrandById(req.params.id);
    res.json({ success: true, message: "Brand fetched", data: { brand } });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:id/status",
  validate(updateBrandStatusSchema, "body"),
  async (req, res, next) => {
    try {
      const result = await brandService.updateBrandStatus(req.params.id, req.body.isActive);
      res.json({
        success: true,
        message: `Brand ${req.body.isActive ? "enabled" : "disabled"} successfully`,
        data: { result },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    await brandService.deleteBrand(req.params.id);
    res.json({ success: true, message: "Brand deleted successfully", data: null });
  } catch (err) {
    next(err);
  }
});

export default router;