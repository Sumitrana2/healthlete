import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { BrandModule } from "../brand/brand.module";
import { BrandIndustriesController } from "./controllers/brand-industries.controller";
import { AdminIndustriesController } from "./controllers/admin-industries.controller";
import { IndustriesService } from "./services/industries.service";
import { AdminIndustriesService } from "./services/admin-industries.service";
import { IndustriesRepository } from "./repositories/industries.repository";

@Module({
  imports: [BrandModule, AdminModule],
  controllers: [BrandIndustriesController, AdminIndustriesController],
  providers: [IndustriesService, AdminIndustriesService, IndustriesRepository],
  exports: [IndustriesService, IndustriesRepository],
})
export class IndustryModule {}
