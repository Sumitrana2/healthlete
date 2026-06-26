import { seedAdmin }   from './seed-admin';
import { seedTaxonomy } from "./taxonomy.seed";
import logger from "../config/logger";

async function runSeeders() {
  logger.info("Starting database seeding...");
  await seedAdmin();
  await seedTaxonomy();
  logger.info("✅ All seeders completed successfully");
  process.exit(0);
}

runSeeders().catch((err) => {
  logger.error({ err }, "❌ Seeding failed");
  process.exit(1);
});
