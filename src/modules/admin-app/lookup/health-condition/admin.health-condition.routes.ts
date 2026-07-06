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
      const { id } = req.params;
      const { name } = req.body;

      const result = await lookupService.updateHealthCondition(id, { name });

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
export default router;
