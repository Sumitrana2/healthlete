import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { BrandModule } from "../brand/brand.module";
import { BrandLanguagesController } from "./controllers/brand-languages.controller";
import { AdminLanguagesController } from "./controllers/admin-languages.controller";
import { LanguagesService } from "./services/languages.service";
import { AdminLanguagesService } from "./services/admin-languages.service";
import { LanguagesRepository } from "./repositories/languages.repository";

@Module({
  imports: [BrandModule, AdminModule],
  controllers: [BrandLanguagesController, AdminLanguagesController],
  providers: [LanguagesService, AdminLanguagesService, LanguagesRepository],
  exports: [LanguagesService, LanguagesRepository],
})
export class LanguageModule {}
