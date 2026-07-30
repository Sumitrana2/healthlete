import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { BrandModule } from "../brand/brand.module";
import { BrandHealthConditionController } from "./controllers/brand-health-condition.controller";
import { AdminHealthConditionController } from "./controllers/admin-health-condition.controller";
import { HealthConditionService } from "./services/health.condition.service";
import { AdminHealthConditionService } from "./services/admin-health.condition.service";
import { HealthConditionRepository } from "./repositories/health.condition.repository";

@Module({
  imports: [BrandModule, AdminModule],
  controllers: [BrandHealthConditionController, AdminHealthConditionController],
  providers: [
    HealthConditionService,
    AdminHealthConditionService,
    HealthConditionRepository,
  ],
  exports: [HealthConditionService, HealthConditionRepository],
})
export class HealthConditionModule {}
