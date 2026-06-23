import { Router } from 'express';
// import { verifyToken } from '../../config/auth0';
// import { attachAdmin, requireSuperAdmin } from '../../middleware/auth';

// import adminAuthRoutes    from '../../modules/admin-app/auth/admin.auth.routes';
// import adminAthleteRoutes from '../../modules/admin-app/athletes/admin.athletes.routes';
// import adminBrandRoutes   from '../../modules/admin-app/brands/admin.brands.routes';
// import adminInviteRoutes  from '../../modules/admin-app/invites/admin.invites.routes';

const router = Router();

// router.use('/auth', adminAuthRoutes);

// router.use('/athletes', verifyToken, attachAdmin, adminAthleteRoutes);
// router.use('/brands',   verifyToken, attachAdmin, adminBrandRoutes);
// router.use('/invites',  verifyToken, attachAdmin, requireSuperAdmin, adminInviteRoutes);

export default router;