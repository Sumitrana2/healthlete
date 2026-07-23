import { Router } from "express";
import { addCampaignFocusSchema, addCompanySchema, completeOnboardingSchema, mediaLanguagePreferencesSchema } from "./brand.schema";
import { validate } from "../../../middleware/validate";
import * as brandService from "./brand.service";

const router = Router();
// router.get("/me", async (req, res) => {
//   res.json({
//     success: true,
//     message: "Profile fetched successfully",
//     data: req.brand,
//   });
// });

router.get("/me", async (req, res, next) => {
  try {
    const result = await brandService.getProfile(req.brand!.id);

    res.json({
      success: true,
      message: "Profile fetched successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});


router.post("/company", validate(addCompanySchema), async (req, res, next) => {
  try {
    const result = await brandService.addCompanyToBrand(
      req.brand!.id,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Company linked successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/campaign-focus",
  validate(addCampaignFocusSchema),
  async (req, res, next) => {
    try {
      const result = await brandService.addCampaignFocus(
        req.brand!.id,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Campaign focus saved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/media-language-preferences",
  validate(mediaLanguagePreferencesSchema),
  async (req, res, next) => {
    try {
      const result = await brandService.addMediaLanguagePreferences(
        req.brand!.id,
        req.body
      );

      res.status(200).json({
        success: true,
        message: "Media & language preferences saved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);
router.post(
  "/complete-onboarding",
  validate(completeOnboardingSchema),
  async (req, res, next) => {
    try {
      const result = await brandService.completeOnboarding(
        req.brand!.id
      );

      res.status(200).json({
        success: true,
        message: "Onboarding completed successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
