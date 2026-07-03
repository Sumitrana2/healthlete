import { Router } from "express";
import * as preferredChannelsService from "./brand.channels.service";

const router = Router();
router.get(
  "/",
  async (req, res, next) => {
    try {
      const results = await preferredChannelsService.getPreferredChannels();
      res.json({
        success: true,
        message: "Channels fetched successfully",
        data: { channels: results },
      });
    } catch (err) {
      next(err);
    }
  }
);
export default router;