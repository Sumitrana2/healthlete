import { db } from "../../database/drizzle";
import { platformTaxonomy } from "../../database/drizzle/schema";
import taxonomyData from "./data/taxonomy.json";
import logger from "../../shared/logger/logger";

export async function seedTaxonomy() {
  logger.info("Seeding platform taxonomy...");
  const { ig, yt } = taxonomyData.result;
  await db
    .insert(platformTaxonomy)
    .values(
      ig.categories.map((item) => ({
        platform: "ig",
        kind: "category",
        externalId: item.id,
        title: item.title,
      }))
    )
    .onConflictDoNothing();
  logger.info(`  → IG categories done (${ig.categories.length})`);
  await db
    .insert(platformTaxonomy)
    .values(
      ig.interests.map((item) => ({
        platform: "ig",
        kind: "interest",
        externalId: item.id,
        title: item.title,
      }))
    )
    .onConflictDoNothing();
  logger.info(`  → IG interests done (${ig.interests.length})`);
  await db
    .insert(platformTaxonomy)
    .values(
      yt.categories.map((item) => ({
        platform: "yt",
        kind: "category",
        externalId: item.id,
        title: item.title,
      }))
    )
    .onConflictDoNothing();
  logger.info(`  → YT categories done (${yt.categories.length})`);
  logger.info("✅ Taxonomy seeding completed");
}
