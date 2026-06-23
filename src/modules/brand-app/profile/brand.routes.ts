import { Router } from "express";
const router = Router();
router.get(
    "/me",
    async (req, res) => {
      res.json({
        success: true,
        data:req.brand
      });
    }
  );
export default router;
