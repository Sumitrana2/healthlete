import bcrypt from "bcryptjs";
import { AppError } from "../../../middleware/errorHandler";
import { sendOtpEmail } from "../../../services/email/email.service";
import * as otpRepo from "./otp.repository";
import * as brandRepo from "./brand.repository";
import { makeUniqueSlug } from "../../../utils/slug";
import { brands } from "../../../db/schema";
import logger from "../../../config/logger";
import type {
  RegisterInput,
  RegisterResult,
  OtpPurpose,
  MessageResult,
  ResetOtpResult,
  LoginResult,
  LogoutResult,
} from "./brand.auth.types";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../utils/jwt";
import type { Request } from "express";
import { AUTH } from "../../../constants/app.constants";

export async function login(
  email: string,
  password: string,
  req?: Request
): Promise<LoginResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const brand = await brandRepo.findBrandByEmail(normalizedEmail);

  if (!brand) {
    await brandRepo.insertAuthLog({
      email: normalizedEmail,
      action: "login",
      status: "failed",
      ip: req?.ip,
      userAgent: req?.headers["user-agent"],
      details: { reason: "brand_not_found" },
    });
    throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }

  if (brand.lockedUntil && brand.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (brand.lockedUntil.getTime() - Date.now()) / 60000
    );
    await brandRepo.insertAuthLog({
      brandId: brand.id,
      email: normalizedEmail,
      action: "login",
      status: "failed",
      ip: req?.ip,
      userAgent: req?.headers["user-agent"],
      details: { reason: "account_locked", minutesLeft },
    });
    throw new AppError(
      423,
      `Account locked. Try again in ${minutesLeft} minutes.`,
      "ACCOUNT_LOCKED"
    );
  }

  if (!brand.isEmailVerified) {
    await brandRepo.insertAuthLog({
      brandId: brand.id,
      email: normalizedEmail,
      action: "login",
      status: "failed",
      ip: req?.ip,
      userAgent: req?.headers["user-agent"],
      details: { reason: "email_not_verified" },
    });
    throw new AppError(
      403,
      "Please verify your email first",
      "EMAIL_NOT_VERIFIED"
    );
  }

  if (brand.approvalStatus === "pending") {
    await brandRepo.insertAuthLog({
      brandId: brand.id,
      email: normalizedEmail,
      action: "login",
      status: "failed",
      ip: req?.ip,
      userAgent: req?.headers["user-agent"],
      details: { reason: "approval_pending" },
    });
    throw new AppError(
      403,
      "Your account is awaiting admin approval",
      "APPROVAL_PENDING"
    );
  }

  if (brand.approvalStatus === "rejected") {
    await brandRepo.insertAuthLog({
      brandId: brand.id,
      email: normalizedEmail,
      action: "login",
      status: "failed",
      ip: req?.ip,
      userAgent: req?.headers["user-agent"],
      details: { reason: "approval_rejected" },
    });
    throw new AppError(
      403,
      "Your registration request was rejected",
      "APPROVAL_REJECTED"
    );
  }

  if (!brand.passwordHash) {
    throw new AppError(
      401,
      "Please use social login for this account",
      "NO_PASSWORD_SET"
    );
  }

  const isPasswordValid = await bcrypt.compare(password, brand.passwordHash);

  if (!isPasswordValid) {
    const updated = await brandRepo.incrementFailedAttempts(normalizedEmail);
    const attempts = updated.failedLoginAttempts ?? 0;
    if (attempts >= AUTH.MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + AUTH.LOCK_DURATION_MS);
      await brandRepo.lockAccount(normalizedEmail, lockUntil);
      await brandRepo.insertAuthLog({
        brandId: brand.id,
        email: normalizedEmail,
        action: "login",
        status: "failed",
        ip: req?.ip,
        userAgent: req?.headers["user-agent"],
        details: { reason: "account_locked_now" },
      });
      throw new AppError(
        423,
        "Account locked for 24 hours due to too many failed attempts.",
        "ACCOUNT_LOCKED"
      );
    }

    await brandRepo.insertAuthLog({
      brandId: brand.id,
      email: normalizedEmail,
      action: "login",
      status: "failed",
      ip: req?.ip,
      userAgent: req?.headers["user-agent"],
      details: { reason: "wrong_password", attemptsLeft: 5 - attempts },
    });
    throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }
  await brandRepo.resetFailedAttempts(normalizedEmail);
  const maxSessions = await brandRepo.getMaxSessions();
  const activeCount = await brandRepo.countActiveSessions(brand.id);
  if (activeCount >= maxSessions) {
    await brandRepo.revokeOldestSession(brand.id);
    logger.info(
      { brandId: brand.id },
      "Oldest session revoked due to session limit"
    );
  }

  const tokenPayload = {
    id: brand.id,
    email: brand.email,
    type: "brand" as const,
  };

  const accessToken = await signAccessToken(tokenPayload);
  const refreshToken = await signRefreshToken(tokenPayload);

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(
    refreshExpiresAt.getDate() + AUTH.REFRESH_EXPIRES_DAYS
  );

  await brandRepo.insertRefreshToken({
    brandId: brand.id,
    token: refreshToken,
    expiresAt: refreshExpiresAt,
    deviceInfo: { ip: req?.ip, userAgent: req?.headers["user-agent"] },
  });

  await brandRepo.updateBrandByEmail(normalizedEmail, {
    lastLoginAt: new Date(),
  });

  await brandRepo.insertAuthLog({
    brandId: brand.id,
    email: normalizedEmail,
    action: "login",
    status: "success",
    ip: req?.ip,
    userAgent: req?.headers["user-agent"],
  });

  logger.info({ brandId: brand.id }, "Brand logged in");

  return {
    brand: {
      id: brand.id,
      email: brand.email,
      firstName: brand.firstName,
      lastName: brand.lastName,
      // companyName: brand.companyName,
      approvalStatus: brand.approvalStatus!,
    },
    accessToken,
    refreshToken,
  };
}
export async function register(input: RegisterInput): Promise<RegisterResult> {
  const email = input.email.toLowerCase().trim();

  
  const existing = await brandRepo.findBrandIdByEmail(email);
  if (existing)
    throw new AppError(409, "Email already registered", "EMAIL_EXISTS");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const slug = await makeUniqueSlug(input.firstName+"-"+input.lastName, brands, brands.slug);

  const brand = await brandRepo.insertBrand({
    email,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    // companyName: input.companyName.trim(),
    passwordHash,
    slug,
    // role: input.role,
    // requestType: input.requestType,
    // budgetRange: input.budgetRange,
    // timeline: input.timeline,
    // campaignGoal: input.campaignGoal,
    // campaignDescription: input.campaignDescription,
    // language: input.language,
    isEmailVerified: false,
    approvalStatus: "approved",
  });

  // if (input.categoryIds?.length) {
  //   const taxonomyIds = await brandRepo.findTaxonomyIdsByExternalIds(
  //     input.categoryIds
  //   );
  //   await brandRepo.insertTaxonomySelections(brand.id, taxonomyIds);
  //   logger.info(
  //     { brandId: brand.id, count: taxonomyIds.length },
  //     "Taxonomy selections saved"
  //   );
  // }

  const otp = await otpRepo.createOtp(email, "email_verify", brand.id);
  await sendOtpEmail(input.email, otp, "email_verify");

  logger.info(
    { brandId: brand.id, email: brand.email },
    "Brand registered, OTP sent"
  );

  return {
    brandId: brand.id,
    email: brand.email,
    message: "Registration successful. Please verify your email.",
  };
}

export async function verifyEmailOtp(
  email: string,
  otp: string,
  req?: Request
): Promise<LoginResult> {
  const result = await otpRepo.verifyOtp(email, otp, "email_verify");
  if (!result.valid)
    throw new AppError(400, "Invalid or expired OTP", result.reason);

  await otpRepo.markOtpUsed(result.record.id);
  const brand = await brandRepo.updateBrandByEmail(email, {
    isEmailVerified: true,
  });

  const tokenPayload = {
    id: brand.id,
    email: brand.email,
    type: "brand" as const,
  };

  const accessToken = await signAccessToken(tokenPayload);
  const refreshToken = await signRefreshToken(tokenPayload);

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(
    refreshExpiresAt.getDate() + AUTH.REFRESH_EXPIRES_DAYS
  );

  await brandRepo.insertRefreshToken({
    brandId: brand.id,
    token: refreshToken,
    expiresAt: refreshExpiresAt,
    deviceInfo: { ip: req?.ip, userAgent: req?.headers["user-agent"] },
  });

  await brandRepo.updateBrandByEmail(email, {
    lastLoginAt: new Date(),
  });

  await brandRepo.insertAuthLog({
    brandId: brand.id,
    email: email,
    action: "login",
    status: "success",
    ip: req?.ip,
    userAgent: req?.headers["user-agent"],
  });

  logger.info({ brandId: brand.id }, "Brand logged in");

  return {
    brand: {
      id: brand.id,
      email: brand.email,
      firstName: brand.firstName,
      lastName: brand.lastName,
      // companyName: brand.companyName,
      approvalStatus: brand.approvalStatus!,
    },
    accessToken,
    refreshToken,
  };
}

export async function resendOtp(
  email: string,
  purpose: OtpPurpose
): Promise<MessageResult> {
  const brand = await brandRepo.findBrandByEmail(email);
  if (!brand) throw new AppError(404, "Account not found", "BRAND_NOT_FOUND");

  const otp = await otpRepo.createOtp(email, purpose, brand.id);
  await sendOtpEmail(email, otp, purpose);

  return { message: "OTP sent" };
}

export async function forgotPassword(email: string): Promise<MessageResult> {
  const brand = await brandRepo.findBrandByEmail(email);
  if (!brand) throw new AppError(401, "Email doesn't exist.", "INVALID_EMAIL");


  const otp = await otpRepo.createOtp(email, "forgot_password", brand.id);
  await sendOtpEmail(email, otp, "forgot_password");

  return { message: "OTP has been sent on your email." };
}

export async function verifyResetOtp(
  email: string,
  otp: string
): Promise<ResetOtpResult> {
  const result = await otpRepo.verifyOtp(email, otp, "forgot_password");
  if (!result.valid)
    throw new AppError(400, "Invalid or expired OTP", result.reason);

  const resetToken = await otpRepo.markOtpUsedWithResetToken(result.record.id);
  return { resetToken };
}

export async function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<MessageResult> {
  const result = await otpRepo.verifyResetToken(email, resetToken);
  if (!result.valid)
    throw new AppError(
      400,
      "Invalid or expired reset token",
      "RESET_TOKEN_INVALID"
    );

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const brand = await brandRepo.updateBrandByEmail(email, { passwordHash });

  await brandRepo.revokeAllBrandSessions(brand.id);
  await brandRepo.insertAuthLog({
    brandId: brand.id,
    email,
    action: "password_reset",
    status: "success",
  });

  return { message: "Password reset successful. Please login again." };
}

export async function refreshToken(
  token: string,
  req?: Request
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = await verifyRefreshToken(token).catch(() => {
    throw new AppError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  });

  const storedToken = await brandRepo.findActiveRefreshToken(token);
  if (!storedToken) {
    throw new AppError(
      401,
      "Invalid or expired refresh token",
      "INVALID_REFRESH_TOKEN"
    );
  }
  await brandRepo.revokeRefreshTokenById(storedToken.id);

  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    type: "brand" as const,
  };

  const accessToken = await signAccessToken(tokenPayload);
  const newRefreshToken = await signRefreshToken(tokenPayload);

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

  await brandRepo.insertRefreshToken({
    brandId: payload.id,
    token: newRefreshToken,
    expiresAt: refreshExpiresAt,
    deviceInfo: {
      ip: req?.ip,
      userAgent: req?.headers["user-agent"] as string,
    },
  });

  logger.info({ brandId: payload.id }, "Token refreshed");

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(
  refreshToken: string,
  brandId: string,
  req?: Request
): Promise<LogoutResult> {
  const storedToken = await brandRepo.findActiveRefreshToken(refreshToken);
  if (storedToken) {
    await brandRepo.revokeRefreshTokenById(storedToken.id);
  }
  await brandRepo.insertAuthLog({
    brandId,
    email: "",
    action: "logout",
    status: "success",
    ip: req?.ip,
    userAgent: req?.headers["user-agent"],
  });
  logger.info({ brandId }, "Brand logged out");
  return { message: "Logged out successfully" };
}
