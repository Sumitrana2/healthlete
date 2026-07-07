import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";
import { toNumber } from "../../../../utils/pagination.util";
import { createHealthConditionSchema, updateHealthConditionSchema } from "./admin.health-condition.schema";
import { validate } from "../../../../middleware/validate";

const router = Router();

router.post(
  "/",
  validate(createHealthConditionSchema),
  async (req, res, next) => {
    try {
      const { name } = req.body;
      const result = await lookupService.createHealthCondition({ name });
      res.status(201).json({
        success: true,
        message: "Health condition created successfully",
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

    const results = await lookupService.getHealthConditions({
      search: search as string,
      page: toNumber(page),
      limit: toNumber(limit),
      isActive: isActive !== undefined ? isActive === "true" : undefined,
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
      message: "Health conditions fetched successfully",
      data:  results ,
    });
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:id",
  validate(updateHealthConditionSchema),
  async (req, res, next) => {
    try {
      const result = await lookupService.updateHealthCondition(
        req.params.id,
        req.body
      );
      res.json({
        success: true,
        message: "Health condition updated successfully",
        data: {
          healthCondition: result,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await lookupService.deleteHealthCondition(req.params.id);

    res.json({
      success: true,
      message: "Health condition deleted successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
export default router;
