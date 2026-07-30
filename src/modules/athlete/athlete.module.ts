import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { BrandModule } from "../brand/brand.module";
import { AiModule } from "../ai/ai.module";
import { HypeAuditorModule } from "../../integrations/hypeauditor/hypeauditor.module";
import { ScoringModule } from "../scoring/scoring.module";
import { AdminAthleteController } from "./controllers/admin-athlete.controller";
import { BrandAthleteController } from "./controllers/brand-athlete.controller";
import { PublicAthleteController } from "./controllers/public-athlete.controller";
import { AdminAthleteService } from "./services/admin-athlete.service";
import { AthleteProfileService } from "./services/athlete-profile.service";
import { AthleteSyncService } from "./services/athlete-sync.service";
import { AthleteDiscoverService } from "./services/athlete-discover.service";
import { AthleteSearchService } from "./services/athlete-search.service";
import { AthleteScoreService } from "./services/athlete-score.service";
import { AthleteRepository } from "./repositories/athlete.repository";
import { AthleteDiscoverRepository } from "./repositories/athlete-discover.repository";
import { AthleteSyncRepository } from "./repositories/athlete-sync.repository";
import { ScoreEngineService } from "../scoring/services/score-engine.service";
import { UploadService } from "../../shared/storage/upload.service";

@Module({
  imports: [
    AdminModule,
    BrandModule,
    AiModule,
    HypeAuditorModule,
    ScoringModule,
  ],
  controllers: [
    AdminAthleteController,
    BrandAthleteController,
    PublicAthleteController,
  ],
  providers: [
    AdminAthleteService,
    AthleteDiscoverService,
    AthleteProfileService,
    AthleteSyncService,
    AthleteSearchService,
    AthleteScoreService,
    ScoreEngineService,
    AthleteRepository,
    AthleteDiscoverRepository,
    AthleteSyncRepository,
    UploadService,
  ],
  exports: [
    AthleteRepository,
    AthleteSyncRepository,
    AthleteScoreService,
    ScoreEngineService,
  ],
})
export class AthleteModule {}
