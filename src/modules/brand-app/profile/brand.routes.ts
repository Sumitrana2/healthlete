import { Router } from "express";
const router = Router();
router.get(
    "/me",
    async (_req, res) => {
      res.json({
        success: true,
        data:{}
      });
    }
  );
export default router;
