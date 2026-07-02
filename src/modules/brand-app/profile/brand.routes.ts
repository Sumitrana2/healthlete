import { Router } from "express";
const router = Router();
router.get("/me", async (req, res) => {
  res.json({
    success: true,
    message: "Profile fetched successfully",
    data: req.brand,
  });
});
export default router;
