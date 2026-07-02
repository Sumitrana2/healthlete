import { Router } from 'express';
import adminAuthRoutes from '../../modules/admin-app/auth/admin.auth.routes';


const router = Router();

router.use('/auth', adminAuthRoutes);

export default router;