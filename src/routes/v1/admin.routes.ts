import { Router } from 'express';
import adminAuthRoutes from '../../modules/admin-app/auth/admin.auth.routes';
import adminLookupCompanyRoutes from '../../modules/admin-app/lookup/company/admin.company.routes';
import adminLookupHealthConditionRoutes from '../../modules/admin-app/lookup/health-condition/admin.health-condition.routes';
import adminLookupCampaignObjectiveRoutes from '../../modules/admin-app/lookup/campaign-objective/admin.campaign-objective.routes';
import adminLookupChannelsRoutes from '../../modules/admin-app/lookup/channels/admin.channels.routes';
import adminLookupLanguagesRoutes from '../../modules/admin-app/lookup/languages/admin.languages.routes';
import adminLookupIndustriesRoutes from '../../modules/admin-app/lookup/industries/admin.industries.routes';
import adminAthleteRoutes from '../../modules/admin-app/athlete/admin.athlete.routes';


import { adminAuthenticate } from "../../middleware/adminAuthenticate";

const router = Router();

router.use('/auth', adminAuthRoutes);

// lookup
router.use('/lookup/company', adminAuthenticate,adminLookupCompanyRoutes);
router.use('/lookup/health-conditions',adminAuthenticate, adminLookupHealthConditionRoutes);
router.use('/lookup/campaign-objectives', adminAuthenticate,adminLookupCampaignObjectiveRoutes);
router.use('/lookup/channels',adminAuthenticate, adminLookupChannelsRoutes);
router.use('/lookup/languages',adminAuthenticate, adminLookupLanguagesRoutes);
router.use('/lookup/industries',adminAuthenticate, adminLookupIndustriesRoutes);


// athlete
router.use('/athletes', adminAuthenticate,adminAthleteRoutes);

export default router;