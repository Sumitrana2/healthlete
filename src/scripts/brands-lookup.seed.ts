import { db } from "../db";
import {
  industries,
  companySizes,
  healthConditions,
  campaignObjectives,
  preferredChannels,
  athleteLanguages,
  companies,
} from "../db/schema/brands";
import logger from "../config/logger";

export async function seedBrandsLookup() {
  logger.info("Seeding brands lookup tables...");

  await db.insert(industries).values([
    { name: "Health & Fitness",         slug: "health-fitness" },
    { name: "Sports & Athletics",        slug: "sports-athletics" },
    { name: "Nutrition & Supplements",   slug: "nutrition-supplements" },
    { name: "Mental Health & Wellness",  slug: "mental-health-wellness" },
    { name: "Medical Devices",           slug: "medical-devices" },
    { name: "Pharmaceuticals",           slug: "pharmaceuticals" },
    { name: "Rehabilitation & Recovery", slug: "rehabilitation-recovery" },
    { name: "Sportswear & Apparel",      slug: "sportswear-apparel" },
    { name: "Sports Equipment",          slug: "sports-equipment" },
    { name: "Digital Health & Apps",     slug: "digital-health-apps" },
    { name: "Food & Beverages",          slug: "food-beverages" },
    { name: "Insurance & Healthcare",    slug: "insurance-healthcare" },
  ]).onConflictDoNothing();
  logger.info("✅ Industries seeded");

  const allIndustries = await db.select().from(industries);
  const industryMap = Object.fromEntries(
    allIndustries.map((i) => [i.slug, i.id])
  );

  await db.insert(companySizes).values([
    { label: "1-10",     sortOrder: 1 },
    { label: "11-50",    sortOrder: 2 },
    { label: "51-200",   sortOrder: 3 },
    { label: "201-500",  sortOrder: 4 },
    { label: "501-1000", sortOrder: 5 },
    { label: "1000+",    sortOrder: 6 },
  ]).onConflictDoNothing();
  logger.info("✅ Company sizes seeded");

  const allSizes = await db.select().from(companySizes);
  const sizeMap = Object.fromEntries(
    allSizes.map((s) => [s.label, s.id])
  );

  await db.insert(healthConditions).values([
    { name: "Diabetes" },
    { name: "Heart Disease" },
    { name: "Obesity" },
    { name: "Hypertension" },
    { name: "Asthma" },
    { name: "Arthritis" },
    { name: "Mental Health" },
    { name: "Cancer" },
    { name: "Chronic Pain" },
    { name: "Digestive Disorders" },
    { name: "Thyroid Disorders" },
    { name: "PCOS" },
    { name: "Sleep Disorders" },
    { name: "Skin Conditions" },
    { name: "Autoimmune Disorders" },
    { name: "Bone & Joint Health" },
    { name: "Women's Health" },
    { name: "Men's Health" },
    { name: "Senior Health" },
    { name: "Sports Injuries" },
  ]).onConflictDoNothing();
  logger.info("✅ Health conditions seeded");

  await db.insert(campaignObjectives).values([
    { name: "Brand Awareness" },
    { name: "Product Launch" },
    { name: "Lead Generation" },
    { name: "App Downloads" },
    { name: "Sales & Conversions" },
    { name: "Community Building" },
    { name: "Educational Content" },
    { name: "Event Promotion" },
    { name: "Social Media Growth" },
    { name: "Website Traffic" },
  ]).onConflictDoNothing();
  logger.info("✅ Campaign objectives seeded");

  await db.insert(preferredChannels).values([
    { name: "Instagram" },
    { name: "YouTube" },
    { name: "Twitter / X" },
    { name: "Facebook" },
    { name: "LinkedIn" },
    { name: "TikTok" },
    { name: "Podcast" },
    { name: "Blog / Website" },
  ]).onConflictDoNothing();
  logger.info("✅ Preferred channels seeded");

  await db.insert(athleteLanguages).values([
    { name: "English",    code: "en" },
    { name: "Hindi",      code: "hi" },
    { name: "Spanish",    code: "es" },
    { name: "French",     code: "fr" },
    { name: "Arabic",     code: "ar" },
    { name: "Portuguese", code: "pt" },
    { name: "German",     code: "de" },
    { name: "Japanese",   code: "ja" },
    { name: "Korean",     code: "ko" },
    { name: "Mandarin",   code: "zh" },
    { name: "Italian",    code: "it" },
    { name: "Russian",    code: "ru" },
  ]).onConflictDoNothing();
  logger.info("✅ Athlete languages seeded");

  await db.insert(companies).values([
    {
      name: "Nike Health",
      website: "https://nike.com",
      industryId: industryMap["sportswear-apparel"],
      companySizeId: sizeMap["1000+"],
    },
    {
      name: "Fittr",
      website: "https://fittr.com",
      industryId: industryMap["health-fitness"],
      companySizeId: sizeMap["51-200"],
    },
    {
      name: "MuscleBlaze",
      website: "https://muscleblaze.com",
      industryId: industryMap["nutrition-supplements"],
      companySizeId: sizeMap["201-500"],
    }
  ]).onConflictDoNothing();
  logger.info("✅ Companies seeded");
}