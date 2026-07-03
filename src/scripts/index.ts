import { seedAdmin }   from './seed-admin';
import { seedTaxonomy } from "./taxonomy.seed";
import logger from "../config/logger";
import { seedBrandsLookup } from './brands-lookup.seed';

async function runSeeders() {
  logger.info("Starting database seeding...");
  await seedAdmin();
  await seedTaxonomy();
  await seedBrandsLookup();
  logger.info("✅ All seeders completed successfully");
  process.exit(0);
}

runSeeders().catch((err) => {
  logger.error({ err }, "❌ Seeding failed");
  process.exit(1);
});
