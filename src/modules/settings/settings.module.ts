import { Module } from "@nestjs/common";
import { TaxonomyController } from "./taxonomy/controllers/taxonomy.controller";
import { TaxonomyService } from "./taxonomy/services/taxonomy.service";
import { TaxonomyRepository } from "./taxonomy/repositories/taxonomy.repository";

@Module({
  controllers: [TaxonomyController],
  providers: [TaxonomyService, TaxonomyRepository],
  exports: [TaxonomyService, TaxonomyRepository],
})
export class SettingsModule {}
