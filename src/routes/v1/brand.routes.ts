import { Router } from "express";

import brandAuthRoutes from "../../modules/brand-app/auth/brand.auth.routes";
import profile from "../../modules/brand-app/profile/brand.routes";
import brandCompany from "../../modules/brand-app/lookup/company/brand.company.routes";
import brandHealthConditions from "../../modules/brand-app/lookup/health-condition/brand.health-condition.routes";
import campaignObjective from "../../modules/brand-app/lookup/campaign-objective/brand.campaign-objective.routes";
import channels from "../../modules/brand-app/lookup/channels/brand.channels.routes";
import languages from "../../modules/brand-app/lookup/languages/brand.languages.routes";
import industries from "../../modules/brand-app/lookup/industries/brand.industries.routes";
import { authenticate } from "../../middleware/authenticate";

const router = Router();

router.use("/auth", brandAuthRoutes);
router.use("/profile", authenticate, profile);
router.use("/company", authenticate, brandCompany);
router.use("/health-conditions", authenticate, brandHealthConditions);
router.use("/campaign-objectives", authenticate, campaignObjective);
router.use("/channels", authenticate, channels);
router.use("/languages", authenticate, languages);
router.use("/industries", authenticate, industries);

export default router;
