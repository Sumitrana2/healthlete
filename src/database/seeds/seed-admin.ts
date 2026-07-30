import { db } from "../../database/drizzle";
import { admins } from "../../database/drizzle/schema";
import { SUPER_ADMIN_PERMISSIONS } from "../../common/constants/admin.constants";
import { makeUniqueSlug } from "../../common/utils/slug";
import logger from "../../shared/logger/logger";
import bcrypt from "bcryptjs";

const ADMIN_EMAIL = "adminhealthlete@yopmail.com";
const ADMIN_FIRST = "Admin";
const ADMIN_LAST = "Healthlete";
const ADMIN_PASSWORD = "Admin@123#";

async function seedAdmin() {
  logger.info("Seeding super admin...");

  const existing = await db.query.admins.findFirst({
    where: (admins, { eq }) => eq(admins.email, ADMIN_EMAIL),
  });

  if (existing) {
    logger.info("Super admin already exists — skipping");
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const slug = await makeUniqueSlug("admin-healthlete", admins, admins.slug);

  await db.insert(admins).values({
    email: ADMIN_EMAIL,
    firstName: ADMIN_FIRST,
    lastName: ADMIN_LAST,
    passwordHash,
    slug,
    role: "super_admin",
    isSuperAdmin: true,
    permissions: SUPER_ADMIN_PERMISSIONS,
    isActive: true,
  });

  logger.info("✅ Super admin created");
  logger.info(`   Email    : ${ADMIN_EMAIL}`);
  logger.info(`   Password : ${ADMIN_PASSWORD}`);
  logger.info("   ⚠️  Change password after first login!");
}

export { seedAdmin };
