import { db } from "../../../db";
import { otpVerifications } from "../../../db/schema";
import { eq, and } from "drizzle-orm";
import { env } from "../../../config/env";
import {
  generateOtp,
  hashOtp,
  compareOtp,
  generateResetToken,
} from "../../../utils/otp";

type OtpPurpose = "email_verify" | "forgot_password";

export async function createOtp(
  email: string,
  purpose: OtpPurpose,
  brandId?: string
) {
  await db
    .update(otpVerifications)
    .set({ isUsed: true })
    .where(
      and(
        eq(otpVerifications.email, email),
        eq(otpVerifications.purpose, purpose),
        eq(otpVerifications.isUsed, false)
      )
    );

  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(otpVerifications).values({
    brandId,
    email,
    otpHash,
    purpose,
    expiresAt,
  });

  return otp;
}

export async function verifyOtp(email: string, otp: string, purpose: OtpPurpose) {
    const [record] = await db.select()
      .from(otpVerifications)
      .where(
        and(
          eq(otpVerifications.email, email),
          eq(otpVerifications.purpose, purpose),
          eq(otpVerifications.isUsed, false),
        )
      )
      .orderBy(otpVerifications.createdAt)
      .limit(1);
  
    if (!record) return { valid: false as const, reason: 'OTP_NOT_FOUND' as const };
    if (record.expiresAt < new Date()) return { valid: false as const, reason: 'OTP_EXPIRED' as const };
    if ((record.attempts ?? 0) >= 5) return { valid: false as const, reason: 'TOO_MANY_ATTEMPTS' as const };
  
    const isMatch = compareOtp(otp, record.otpHash);
  
    if (!isMatch) {
      await db.update(otpVerifications)
        .set({ attempts: (record.attempts ?? 0) + 1 })
        .where(eq(otpVerifications.id, record.id));
  
      return { valid: false as const, reason: 'OTP_INVALID' as const };
    }
      return { valid: true as const, record };
  }

export async function markOtpUsedWithResetToken(otpId: string) {
  const resetToken = generateResetToken();
  const resetTokenExpiresAt = new Date(
    Date.now() + env.RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000
  );

  await db
    .update(otpVerifications)
    .set({ isUsed: true, resetToken, resetTokenExpiresAt })
    .where(eq(otpVerifications.id, otpId));

  return resetToken;
}

export async function markOtpUsed(otpId: string) {
  await db
    .update(otpVerifications)
    .set({ isUsed: true })
    .where(eq(otpVerifications.id, otpId));
}

export async function verifyResetToken(email: string, token: string) {
  const [record] = await db
    .select()
    .from(otpVerifications)
    .where(
      and(
        eq(otpVerifications.email, email),
        eq(otpVerifications.resetToken, token),
        eq(otpVerifications.purpose, "forgot_password")
      )
    )
    .limit(1);

  if (!record) return { valid: false as const };
  if (!record.resetTokenExpiresAt || record.resetTokenExpiresAt < new Date()) {
    return { valid: false as const };
  }

  return { valid: true as const, record };
}
