import { Router } from "express";
import * as lookupService from "../../../core/lookup/lookup.service";
import { toNumber } from "../../../../utils/pagination.util";
import { validate } from "../../../../middleware/validate";
import { createChannelsSchema, updatePreferredChannelSchema } from "./admin.channels.schema";

const router = Router();

router.post(
  "/",
  validate(createChannelsSchema),
  async (req, res, next) => {
    try {
      const { name } = req.body;
      const result = await lookupService.createPreferredChannel({ name });
      res.status(201).json({
        success: true,
        message: "Preferred channel created successfully",
        data: { industry: result },
      });
    } catch (err) {
      next(err);
    }
  }
);


router.get(
  "/",
  async (req, res, next) => {
    try {
      const { search, page=1, limit=10, isActive } = req.query;
      const results = await lookupService.getPreferredChannels({
        search: search as string,
        page: toNumber(page),
        limit: toNumber(limit),
        isActive: isActive !== undefined ? isActive === "true" : true,
        fields: ["id", "name", "isActive", "createdAt", "updatedAt"],
      });
      res.json({
        success: true,
        message: "Channels fetched successfully",
        data: results ,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  "/:id",
  validate(updatePreferredChannelSchema),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const channel = await lookupService.updatePreferredChannel(id, {
        name,
      });

      res.json({
        success: true,
        message: "Preferred channel updated successfully",
        data: {
          preferredChannel: channel,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await lookupService.deletePreferredChannel(req.params.id);

    res.json({
      success: true,
      message: "Preferred channel deleted successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
export default router;