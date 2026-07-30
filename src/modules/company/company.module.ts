import { Module } from "@nestjs/common";
import { BrandModule } from "../brand/brand.module";
import { BrandCompanyController } from "./controllers/brand-company.controller";
import { CompanyService } from "./services/company.service";
import { CompanyRepository } from "./repositories/company.repository";

@Module({
  imports: [BrandModule],
  controllers: [BrandCompanyController],
  providers: [CompanyService, CompanyRepository],
})
export class CompanyModule {}
