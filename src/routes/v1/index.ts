import { Router } from 'express';
import brandRouter from './brand.routes';
import adminRouter from './admin.routes';
import commonRouter from './common.routes';

const router = Router();

router.use('/brand', brandRouter);
router.use('/admin', adminRouter);
router.use('/common', commonRouter); 

export default router;