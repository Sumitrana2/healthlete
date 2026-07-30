#!/usr/bin/env node
/**
 * One-time restructure script — maps src/ to target folder layout.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function move(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn("SKIP (missing):", src);
    return;
  }
  ensureDir(path.dirname(dest));
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.renameSync(src, dest);
  console.log("MOVE:", path.relative(ROOT, src), "->", path.relative(ROOT, dest));
}

function copy(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function touch(file, content = "") {
  ensureDir(path.dirname(file));
  if (!fs.existsSync(file)) fs.writeFileSync(file, content);
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".ts") || entry.name.endsWith(".json")) files.push(full);
  }
  return files;
}

function replaceInFile(file, replacements) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, "utf8");
  let changed = false;
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (changed) fs.writeFileSync(file, content);
}

// ─── Phase 1: common consolidation ───────────────────────────────────────────
move(path.join(SRC, "constants"), path.join(SRC, "common/constants"));
move(path.join(SRC, "utils"), path.join(SRC, "common/utils"));
move(path.join(SRC, "common/errors/app.error.ts"), path.join(SRC, "common/exceptions/app.error.ts"));
move(path.join(SRC, "common/swagger/api-response.decorator.ts"), path.join(SRC, "common/decorators/api-response.decorator.ts"));
move(path.join(SRC, "middleware/requestLogger.ts"), path.join(SRC, "common/middleware/requestLogger.ts"));
move(path.join(SRC, "services/upload/upload.middleware.ts"), path.join(SRC, "common/middleware/upload.middleware.ts"));

// ─── Phase 2: shared ─────────────────────────────────────────────────────────
ensureDir(path.join(SRC, "shared/mail"));
move(path.join(SRC, "services/email/email.service.ts"), path.join(SRC, "shared/mail/mail.service.ts"));
move(path.join(SRC, "services/email/email.module.ts"), path.join(SRC, "shared/mail/mail.module.ts"));
move(path.join(SRC, "services/upload/upload.service.ts"), path.join(SRC, "shared/storage/upload.service.ts"));
move(path.join(SRC, "services/upload/upload.types.ts"), path.join(SRC, "shared/storage/upload.types.ts"));
move(path.join(SRC, "config/logger.ts"), path.join(SRC, "shared/logger/logger.ts"));
move(path.join(SRC, "config/redis.ts"), path.join(SRC, "shared/queue/redis.client.ts"));
move(path.join(SRC, "redis/redis.module.ts"), path.join(SRC, "shared/queue/redis.module.ts"));

// ─── Phase 3: database ───────────────────────────────────────────────────────
move(path.join(SRC, "db"), path.join(SRC, "database/drizzle"));
move(path.join(SRC, "database/drizzle/migrations"), path.join(SRC, "database/migrations"));
move(path.join(SRC, "scripts"), path.join(SRC, "database/seeds"));
touch(path.join(SRC, "database/prisma/.gitkeep"));

// Copy enums to common
copy(
  path.join(SRC, "database/drizzle/schema/enums.ts"),
  path.join(SRC, "common/enums/db.enums.ts")
);

// ─── Phase 4: guards to domain modules ───────────────────────────────────────
ensureDir(path.join(SRC, "modules/brand/guards"));
ensureDir(path.join(SRC, "modules/admin/guards"));
move(path.join(SRC, "common/guards/brand-auth.guard.ts"), path.join(SRC, "modules/brand/guards/brand-auth.guard.ts"));
move(path.join(SRC, "common/guards/admin-auth.guard.ts"), path.join(SRC, "modules/admin/guards/admin-auth.guard.ts"));

// ─── Phase 5: brand auth restructure ─────────────────────────────────────────
const brandAuth = path.join(SRC, "modules/brand/auth");
ensureDir(path.join(SRC, "modules/brand/controllers"));
ensureDir(path.join(SRC, "modules/brand/services"));
ensureDir(path.join(SRC, "modules/brand/repositories"));
ensureDir(path.join(SRC, "modules/brand/dto"));
ensureDir(path.join(SRC, "modules/brand/types"));

move(path.join(brandAuth, "brand-auth.controller.ts"), path.join(SRC, "modules/brand/controllers/brand-auth.controller.ts"));
move(path.join(SRC, "modules/brand/profile/brand-profile.controller.ts"), path.join(SRC, "modules/brand/controllers/brand-profile.controller.ts"));
move(path.join(brandAuth, "brand.auth.service.ts"), path.join(SRC, "modules/brand/services/brand-auth.service.ts"));
move(path.join(brandAuth, "brand.repository.ts"), path.join(SRC, "modules/brand/repositories/brand.repository.ts"));
move(path.join(brandAuth, "otp.repository.ts"), path.join(SRC, "modules/brand/repositories/otp.repository.ts"));
move(path.join(brandAuth, "brand.auth.schema.ts"), path.join(SRC, "modules/brand/dto/brand-auth.dto.ts"));
move(path.join(brandAuth, "brand.auth.types.ts"), path.join(SRC, "modules/brand/types/brand-auth.types.ts"));

// ─── Phase 6: admin auth restructure ─────────────────────────────────────────
const adminAuth = path.join(SRC, "modules/admin/auth");
ensureDir(path.join(SRC, "modules/admin/controllers"));
ensureDir(path.join(SRC, "modules/admin/services"));
ensureDir(path.join(SRC, "modules/admin/repositories"));
ensureDir(path.join(SRC, "modules/admin/dto"));
ensureDir(path.join(SRC, "modules/admin/types"));

move(path.join(adminAuth, "admin-auth.controller.ts"), path.join(SRC, "modules/admin/controllers/admin-auth.controller.ts"));
move(path.join(adminAuth, "admin.auth.service.ts"), path.join(SRC, "modules/admin/services/admin-auth.service.ts"));
move(path.join(adminAuth, "admin.auth.repository.ts"), path.join(SRC, "modules/admin/repositories/admin-auth.repository.ts"));
move(path.join(adminAuth, "admin.auth.schema.ts"), path.join(SRC, "modules/admin/dto/admin-auth.dto.ts"));
move(path.join(adminAuth, "admin.auth.types.ts"), path.join(SRC, "modules/admin/types/admin-auth.types.ts"));

// ─── Phase 7: company module ─────────────────────────────────────────────────
ensureDir(path.join(SRC, "modules/company/controllers"));
ensureDir(path.join(SRC, "modules/company/services"));
ensureDir(path.join(SRC, "modules/company/repositories"));
ensureDir(path.join(SRC, "modules/company/dto"));
ensureDir(path.join(SRC, "modules/company/types"));

move(path.join(SRC, "modules/brand/company/brand-company.controller.ts"), path.join(SRC, "modules/company/controllers/brand-company.controller.ts"));
move(path.join(SRC, "modules/brand/company/brand.company.service.ts"), path.join(SRC, "modules/company/services/company.service.ts"));
move(path.join(SRC, "modules/brand/company/brand.company.repository.ts"), path.join(SRC, "modules/company/repositories/company.repository.ts"));
move(path.join(SRC, "modules/brand/company/brand.company.schema.ts"), path.join(SRC, "modules/company/dto/company.dto.ts"));
move(path.join(SRC, "modules/brand/company/brand.company.types.ts"), path.join(SRC, "modules/company/types/company.types.ts"));

// ─── Phase 8: lookup module (taxonomy + shared lookups) ──────────────────────
const lookupEntities = [
  "languages",
  "channels",
  "industries",
  "health-condition",
  "campaign-objective",
];

for (const entity of lookupEntities) {
  const kebab = entity;
  const brandDir = path.join(SRC, "modules/brand", entity);
  const adminDir = path.join(SRC, "modules/admin/lookup", entity);
  const target = path.join(SRC, "modules/lookup", kebab);
  ensureDir(path.join(target, "controllers"));
  ensureDir(path.join(target, "services"));
  ensureDir(path.join(target, "repositories"));
  ensureDir(path.join(target, "dto"));
  ensureDir(path.join(target, "types"));

  // brand files
  const brandPrefix = entity.replace(/-/g, ".");
  if (fs.existsSync(brandDir)) {
    for (const f of fs.readdirSync(brandDir)) {
      const src = path.join(brandDir, f);
      if (f.includes("controller")) move(src, path.join(target, "controllers", `brand-${kebab}.controller.ts`));
      else if (f.includes("service") && !f.includes("test")) move(src, path.join(target, "services", `${kebab.replace(/-/g, ".")}.service.ts`));
      else if (f.includes("repository")) move(src, path.join(target, "repositories", `${kebab.replace(/-/g, ".")}.repository.ts`));
      else if (f.includes("schema")) move(src, path.join(target, "dto", `${kebab}.dto.ts`));
      else if (f.includes("types")) move(src, path.join(target, "types", `${kebab}.types.ts`));
      else if (f.includes("test")) move(src, path.join(target, "services", `${kebab.replace(/-/g, ".")}.service.test.ts`));
    }
  }

  // admin files - merge repo/service if brand already moved
  if (fs.existsSync(adminDir)) {
    for (const f of fs.readdirSync(adminDir)) {
      const src = path.join(adminDir, f);
      if (f.includes("controller")) move(src, path.join(target, "controllers", `admin-${kebab}.controller.ts`));
      else if (f.includes("service")) {
        const dest = path.join(target, "services", `admin-${kebab.replace(/-/g, ".")}.service.ts`);
        if (!fs.existsSync(path.join(target, "services", `${kebab.replace(/-/g, ".")}.service.ts`))) {
          move(src, path.join(target, "services", `${kebab.replace(/-/g, ".")}.service.ts`));
        } else move(src, dest);
      } else if (f.includes("repository")) {
        const dest = path.join(target, "repositories", `${kebab.replace(/-/g, ".")}.repository.ts`);
        if (!fs.existsSync(dest)) move(src, dest);
        else fs.rmSync(src);
      } else if (f.includes("schema")) move(src, path.join(target, "dto", `admin-${kebab}.dto.ts`));
      else if (f.includes("types")) move(src, path.join(target, "types", `admin-${kebab}.types.ts`));
    }
  }
}

// admin/lookup/company -> lookup/company
{
  const entity = "company";
  const brandDir = path.join(SRC, "modules/brand/company");
  const adminDir = path.join(SRC, "modules/admin/lookup/company");
  const target = path.join(SRC, "modules/lookup/company");
  ensureDir(path.join(target, "controllers"));
  ensureDir(path.join(target, "services"));
  ensureDir(path.join(target, "repositories"));
  ensureDir(path.join(target, "dto"));
  ensureDir(path.join(target, "types"));
  if (fs.existsSync(adminDir)) {
    for (const f of fs.readdirSync(adminDir)) {
      const src = path.join(adminDir, f);
      if (f.includes("controller")) move(src, path.join(target, "controllers", "admin-company.controller.ts"));
      else if (f.includes("service")) move(src, path.join(target, "services", "admin-company.service.ts"));
      else if (f.includes("repository")) move(src, path.join(target, "repositories", "company-lookup.repository.ts"));
      else if (f.includes("schema")) move(src, path.join(target, "dto", "company-lookup.dto.ts"));
      else if (f.includes("types")) move(src, path.join(target, "types", "company-lookup.types.ts"));
    }
  }
}

// taxonomy from core
{
  const target = path.join(SRC, "modules/lookup/taxonomy");
  const coreTax = path.join(SRC, "modules/core/taxonomy");
  ensureDir(path.join(target, "controllers"));
  ensureDir(path.join(target, "services"));
  ensureDir(path.join(target, "repositories"));
  ensureDir(path.join(target, "dto"));
  ensureDir(path.join(target, "types"));
  if (fs.existsSync(coreTax)) {
    move(path.join(coreTax, "taxonomy.controller.ts"), path.join(target, "controllers/taxonomy.controller.ts"));
    move(path.join(coreTax, "taxonomy.service.ts"), path.join(target, "services/taxonomy.service.ts"));
    move(path.join(coreTax, "taxonomy.repository.ts"), path.join(target, "repositories/taxonomy.repository.ts"));
    move(path.join(coreTax, "taxonomy.schema.ts"), path.join(target, "dto/taxonomy.dto.ts"));
    move(path.join(coreTax, "taxonomy.types.ts"), path.join(target, "types/taxonomy.types.ts"));
  }
}

// ─── Phase 9: auth module (shared JWT/cookies) ───────────────────────────────
ensureDir(path.join(SRC, "modules/auth/services"));
ensureDir(path.join(SRC, "modules/auth/strategies"));
move(path.join(SRC, "common/utils/jwt.ts"), path.join(SRC, "modules/auth/services/jwt.service.ts"));
move(path.join(SRC, "common/utils/cookies.ts"), path.join(SRC, "modules/auth/services/cookies.service.ts"));
move(path.join(SRC, "common/utils/otp.ts"), path.join(SRC, "modules/auth/services/otp.service.ts"));

// ─── Phase 10: health module ─────────────────────────────────────────────────
ensureDir(path.join(SRC, "modules/health/controllers"));
move(path.join(SRC, "health.controller.ts"), path.join(SRC, "modules/health/controllers/health.controller.ts"));

// ─── Phase 11: placeholder modules ───────────────────────────────────────────
const placeholders = [
  "athlete", "agency", "campaign", "onboarding", "notification", "upload", "dashboard", "analytics",
];
for (const mod of placeholders) {
  const dir = path.join(SRC, "modules", mod);
  ensureDir(path.join(dir, "controllers"));
  ensureDir(path.join(dir, "services"));
  ensureDir(path.join(dir, "repositories"));
  ensureDir(path.join(dir, "dto"));
  ensureDir(path.join(dir, "entities"));
  touch(path.join(dir, `${mod}.module.ts`), `import { Module } from "@nestjs/common";\n\n@Module({})\nexport class ${mod.charAt(0).toUpperCase() + mod.slice(1)}Module {}\n`);
}

touch(path.join(SRC, "shared/sms/.gitkeep"));
touch(path.join(SRC, "common/dto/.gitkeep"));
touch(path.join(SRC, "common/types/.gitkeep"));

// ─── Cleanup empty dirs ──────────────────────────────────────────────────────
function rmEmpty(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) rmEmpty(full);
  }
  if (fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
}
["services", "redis", "middleware", "constants", "utils", "scripts", "db", "common/errors", "common/swagger", "common/guards", "routes"].forEach((d) => rmEmpty(path.join(SRC, d)));

// ─── Phase 12: global import replacements ────────────────────────────────────
const replacements = [
  ["common/errors/app.error", "common/exceptions/app.error"],
  ["common/swagger/api-response.decorator", "common/decorators/api-response.decorator"],
  ["services/email/email.service", "shared/mail/mail.service"],
  ["services/email/email.module", "shared/mail/mail.module"],
  ["EmailService", "MailService"],
  ["EmailModule", "MailModule"],
  ["services/upload/upload.service", "shared/storage/upload.service"],
  ["services/upload/upload.types", "shared/storage/upload.types"],
  ["UploadService", "UploadService"],
  ["config/logger", "shared/logger/logger"],
  ["config/redis", "shared/queue/redis.client"],
  ["redis/redis.module", "shared/queue/redis.module"],
  ["RedisModule", "RedisModule"],
  ["/db/schema", "/database/drizzle/schema"],
  ["/db\"", "/database/drizzle\""],
  ["/db'", "/database/drizzle'"],
  ["from \"../db\"", "from \"../database/drizzle\""],
  ["from '../../db'", "from '../../database/drizzle'"],
  ["from \"../../db\"", "from \"../../database/drizzle\""],
  ["from '../../../db'", "from '../../../database/drizzle'"],
  ["from \"../../../db\"", "from \"../../../database/drizzle\""],
  ["from '../../../../db'", "from '../../../../database/drizzle'"],
  ["from \"../../../../db\"", "from \"../../../../database/drizzle\""],
  ["from '../../constants/", "from '../../common/constants/"],
  ["from \"../../constants/", "from \"../../common/constants/"],
  ["from '../../../constants/", "from '../../../common/constants/"],
  ["from \"../../../constants/", "from \"../../../common/constants/"],
  ["from '../../../../constants/", "from '../../../../common/constants/"],
  ["from '../../utils/", "from '../../common/utils/"],
  ["from '../../../utils/", "from '../../../common/utils/"],
  ["from '../../../../utils/", "from '../../../../common/utils/"],
  ["from '../../../utils/jwt'", "from '../../../modules/auth/services/jwt.service'"],
  ["from \"../../../utils/jwt\"", "from \"../../../modules/auth/services/jwt.service\""],
  ["from '../../utils/jwt'", "from '../../modules/auth/services/jwt.service'"],
  ["from '../utils/jwt'", "from '../modules/auth/services/jwt.service'"],
  ["from '../../../utils/cookies'", "from '../../../modules/auth/services/cookies.service'"],
  ["from '../../utils/cookies'", "from '../../modules/auth/services/cookies.service'"],
  ["from '../../../utils/otp'", "from '../../../modules/auth/services/otp.service'"],
  ["from '../../../../utils/otp'", "from '../../../../modules/auth/services/otp.service'"],
  ["middleware/requestLogger", "common/middleware/requestLogger"],
  ["./constants/app.constants", "./common/constants/app.constants"],
  ["from \"./db\"", "from \"./database/drizzle\""],
  ["checkDatabaseConnection, closeDatabaseConnection } from \"./db\"", "checkDatabaseConnection, closeDatabaseConnection } from \"./database/drizzle\""],
  ["brand-app.module", "brand.module"],
  ["BrandAppModule", "BrandModule"],
  ["admin-app.module", "admin.module"],
  ["AdminAppModule", "AdminModule"],
  ["core.module", "lookup.module"],
  ["CoreModule", "LookupModule"],
  ["brand.auth.schema", "brand-auth.dto"],
  ["admin.auth.schema", "admin-auth.dto"],
  ["brand.auth.types", "brand-auth.types"],
  ["admin.auth.types", "admin-auth.types"],
  ["brand.auth.service", "brand-auth.service"],
  ["admin.auth.service", "admin-auth.service"],
  ["admin.auth.repository", "admin-auth.repository"],
  ["shared/mail/mail.service", "shared/mail/mail.service"],
];

const allFiles = walk(SRC).concat(walk(path.join(ROOT, "test")));
for (const file of allFiles) {
  replaceInFile(file, replacements);
}

console.log("\n✅ Restructure complete. Run npm run build to verify.");
