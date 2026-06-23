import { Router } from "express";
import taxonomyRoutes from "../../modules/core/taxonomy/taxonomy.routes";

const router = Router();

router.use('/taxonomy', taxonomyRoutes);

export default router;