import { Injectable } from "@nestjs/common";
import { db } from "../../../database/drizzle";
import {
  admins,
  adminRefreshTokens,
  adminAuthLogs,
  adminOtpVerifications,
} from "../../../database/drizzle/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import {
  generateOtp,
  hashOtp,
  compareOtp,
  generateResetToken,
} from "../../../modules/auth/services/otp.service";
import { env } from "../../../config/env";

@Injectable()
export class AdminAuthRepository {
async findAdminByEmail(email: string) {
  const [admin] = await db.select().from(admins).where(eq(admins.email, email));
  return admin ?? null;
}

  async updateAdminByEmail(
  email: string,
  values: Partial<typeof admins.$inferInsert>
) {
  const [updated] = await db
    .update(admins)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(admins.email, email))
    .returning();
  return updated;
}

  async incrementFailedAttempts(email: string) {
  const [admin] = await db
    .update(admins)
    .set({
      failedLoginAttempts: sql`${admins.failedLoginAttempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(admins.email, email))
    .returning();
  return admin;
}

  async resetFailedAttempts(email: string) {
  await db
    .update(admins)
    .set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
    .where(eq(admins.email, email));
}

  async lockAccount(email: string, until: Date) {
  await db
    .update(admins)
    .set({ lockedUntil: until, updatedAt: new Date() })
    .where(eq(admins.email, email));
}

  async insertRefreshToken(values: {
  adminId: string;
  token: string;
  expiresAt: Date;
  deviceInfo?: { ip?: string; userAgent?: string };
}) {
  const [row] = await db.insert(adminRefreshTokens).values(values).returning();
  return row;
}

  async findActiveRefreshToken(token: string) {
  const [row] = await db
    .select()
    .from(adminRefreshTokens)
    .where(
      and(
        eq(adminRefreshTokens.token, token),
        isNull(adminRefreshTokens.revokedAt),
        sql`${adminRefreshTokens.expiresAt} > NOW()`
      )
    );
  return row ?? null;
}

  async revokeRefreshTokenById(id: string) {
  await db
    .update(adminRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(adminRefreshTokens.id, id));
}

  async revokeAllAdminSessions(adminId: string) {
  await db
    .update(adminRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(adminRefreshTokens.adminId, adminId));
}

  async countActiveSessions(adminId: string) {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(adminRefreshTokens)
    .where(
      and(
        eq(adminRefreshTokens.adminId, adminId),
        isNull(adminRefreshTokens.revokedAt),
        sql`${adminRefreshTokens.expiresAt} > NOW()`
      )
    );
  return result.count;
}

  async revokeOldestSession(adminId: string) {
  const [oldest] = await db
    .select({ id: adminRefreshTokens.id })
    .from(adminRefreshTokens)
    .where(
      and(
        eq(adminRefreshTokens.adminId, adminId),
        isNull(adminRefreshTokens.revokedAt),
        sql`${adminRefreshTokens.expiresAt} > NOW()`
      )
    )
    .orderBy(adminRefreshTokens.createdAt)
    .limit(1);

  if (oldest) {
    await db
      .update(adminRefreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(adminRefreshTokens.id, oldest.id));
  }
}

  async insertAuthLog(values: typeof adminAuthLogs.$inferInsert) {
  await db.insert(adminAuthLogs).values(values);
}

  async createOtp(
  email: string,
  purpose: "email_verify" | "forgot_password",
  adminId?: string
) {

    await db
    .update(adminOtpVerifications)
    .set({ isUsed: true })
    .where(
      and(
        eq(adminOtpVerifications.email, email),
        eq(adminOtpVerifications.purpose, purpose),
        eq(adminOtpVerifications.isUsed, false)
      )
    );

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(adminOtpVerifications).values({
    adminId,
    email,
    otpHash,
    purpose,
    expiresAt,
  });

  return otp;
}

  async verifyOtp(
  email: string,
  otp: string,
  purpose: "email_verify" | "forgot_password"
) {
  const [record] = await db
    .select()
    .from(adminOtpVerifications)
    .where(
      and(
        eq(adminOtpVerifications.email, email),
        eq(adminOtpVerifications.purpose, purpose),
        eq(adminOtpVerifications.isUsed, false)
      )
    )
    .orderBy(adminOtpVerifications.createdAt)
    .limit(1);

  if (!record)
    return { valid: false as const, reason: "OTP_NOT_FOUND" as const };
  if (record.expiresAt < new Date())
    return { valid: false as const, reason: "OTP_EXPIRED" as const };
  if ((record.attempts ?? 0) >= 5)
    return { valid: false as const, reason: "TOO_MANY_ATTEMPTS" as const };

  const isMatch = compareOtp(otp, record.otpHash);

  if (!isMatch) {
    await db
      .update(adminOtpVerifications)
      .set({ attempts: (record.attempts ?? 0) + 1 })
      .where(eq(adminOtpVerifications.id, record.id));

    return { valid: false as const, reason: "OTP_INVALID" as const };
  }

  return { valid: true as const, record };
}

  async markOtpUsed(otpId: string) {
  await db
    .update(adminOtpVerifications)
    .set({ isUsed: true })
    .where(eq(adminOtpVerifications.id, otpId));
}

  async markOtpUsedWithResetToken(otpId: string) {
  const resetToken = generateResetToken();
  const resetTokenExpiresAt = new Date(
    Date.now() + env.RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  await db
    .update(adminOtpVerifications)
    .set({ isUsed: true, resetToken, resetTokenExpiresAt })
    .where(eq(adminOtpVerifications.id, otpId));

  return resetToken;
}

  async verifyResetToken(email: string, token: string) {
  const [record] = await db
    .select()
    .from(adminOtpVerifications)
    .where(
      and(
        eq(adminOtpVerifications.email, email),
        eq(adminOtpVerifications.resetToken, token),
        eq(adminOtpVerifications.purpose, "forgot_password")
      )
    )
    .limit(1);

  if (!record) return { valid: false as const };
  if (!record.resetTokenExpiresAt || record.resetTokenExpiresAt < new Date())
    return { valid: false as const };

  return { valid: true as const, record };
}
}
