import { Module } from "@nestjs/common";
import { BrandAuthController } from "./controllers/brand-auth.controller";
import { BrandProfileController } from "./controllers/brand-profile.controller";
import { AdminBrandController } from "./controllers/admin-brand.controller";
import { AdminCompanyController } from "./company-lookup/controllers/admin-company.controller";
import { BrandAuthGuard } from "./guards/brand-auth.guard";
import { BrandAuthService } from "./services/brand-auth.service";
import { BrandProfileService } from "./services/brand-profile.service";
import { AdminBrandService } from "./services/admin-brand.service";
import { AdminCompanyService } from "./company-lookup/services/admin-company.service";
import { BrandRepository } from "./repositories/brand.repository";
import { BrandProfileRepository } from "./repositories/brand-profile.repository";
import { AdminBrandRepository } from "./repositories/admin-brand.repository";
import { CompanyLookupRepository } from "./company-lookup/repositories/company-lookup.repository";
import { OtpRepository } from "./repositories/otp.repository";
import { AdminModule } from "../admin/admin.module";

@Module({
  imports: [AdminModule],
  controllers: [
    BrandAuthController,
    BrandProfileController,
    AdminBrandController,
    AdminCompanyController,
  ],
  providers: [
    BrandAuthGuard,
    BrandAuthService,
    BrandProfileService,
    AdminBrandService,
    AdminCompanyService,
    BrandRepository,
    BrandProfileRepository,
    AdminBrandRepository,
    CompanyLookupRepository,
    OtpRepository,
  ],
  exports: [BrandAuthGuard, BrandRepository],
})
export class BrandModule {}
