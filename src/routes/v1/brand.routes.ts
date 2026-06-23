import { Router } from 'express';
// import { verifyToken } from '../../config/auth0';
// import { attachBrand } from '../../middleware/auth';

import brandAuthRoutes     from '../../modules/brand-app/auth/brand.auth.routes';
import profile     from '../../modules/brand-app/profile/brand.routes';
import { authenticate } from "../../middleware/authenticate";

// import brandAthleteRoutes  from '../../modules/brand-app/athletes/brand.athletes.routes';
// import brandScoreRoutes    from '../../modules/brand-app/scores/brand.scores.routes';
// import brandCampaignRoutes from '../../modules/brand-app/campaigns/brand.campaigns.routes';

const router = Router();

router.use('/auth', brandAuthRoutes);
router.use('/profile',authenticate, profile);

// router.use('/athletes',  verifyToken, attachBrand, brandAthleteRoutes);
// router.use('/scores',    verifyToken, attachBrand, brandScoreRoutes);
// router.use('/campaigns', verifyToken, attachBrand, brandCampaignRoutes);

export default router;