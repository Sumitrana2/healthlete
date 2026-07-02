import { Router } from 'express';

import brandAuthRoutes     from '../../modules/brand-app/auth/brand.auth.routes';
import profile     from '../../modules/brand-app/profile/brand.routes';
import { authenticate } from "../../middleware/authenticate";

const router = Router();

router.use('/auth', brandAuthRoutes);
router.use('/profile',authenticate, profile);

export default router;