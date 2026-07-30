import { Injectable } from "@nestjs/common";
import { BrandRepository } from "../repositories/brand.repository";
import bcrypt from "bcryptjs";
import { AppError } from "../../../common/exceptions/app.error";
import { MailService } from "../../../shared/mail/mail.service";
import { OtpRepository } from "../repositories/otp.repository";
import { makeUniqueSlug } from "../../../common/utils/slug";
import { brands } from "../../../database/drizzle/schema";
import logger from "../../../shared/logger/logger";
import type {
  RegisterInput,
  RegisterResult,
  OtpPurpose,
  MessageResult,
  ResetOtpResult,
  LoginResult,
  LogoutResult,
} from "../types/brand-auth.types";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../modules/auth/services/jwt.service";
import type { Request } from "express";
import { AUTH } from "../../../common/constants/app.constants";

@Injectable()
export class BrandAuthService {
  constructor(
    private readonly brandRepository: BrandRepository,
    private readonly otpRepository: OtpRepository,
    private readonly mailService: MailService,
  ) {}

  async login(
  email: string,
  password: string,
  req?: Request
): Promise<LoginResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const brand = await this.brandRepository.findBrandByEmail(normalizedEmail);

  if (!brand) {
    await this.brandRepository.insertAuthLog({
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
    await this.brandRepository.insertAuthLog({
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
    await this.brandRepository.insertAuthLog({
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
    await this.brandRepository.insertAuthLog({
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
    await this.brandRepository.insertAuthLog({
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
    const updated = await this.brandRepository.incrementFailedAttempts(normalizedEmail);
    const attempts = updated.failedLoginAttempts ?? 0;
    if (attempts >= AUTH.MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + AUTH.LOCK_DURATION_MS);
      await this.brandRepository.lockAccount(normalizedEmail, lockUntil);
      await this.brandRepository.insertAuthLog({
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

    await this.brandRepository.insertAuthLog({
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
  await this.brandRepository.resetFailedAttempts(normalizedEmail);
  const maxSessions = await this.brandRepository.getMaxSessions();
  const activeCount = await this.brandRepository.countActiveSessions(brand.id);
  if (activeCount >= maxSessions) {
    await this.brandRepository.revokeOldestSession(brand.id);
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

  await this.brandRepository.insertRefreshToken({
    brandId: brand.id,
    token: refreshToken,
    expiresAt: refreshExpiresAt,
    deviceInfo: { ip: req?.ip, userAgent: req?.headers["user-agent"] },
  });

  await this.brandRepository.updateBrandByEmail(normalizedEmail, {
    lastLoginAt: new Date(),
  });

  await this.brandRepository.insertAuthLog({
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
  async register(input: RegisterInput): Promise<RegisterResult> {
  const email = input.email.toLowerCase().trim();

  
  const existing = await this.brandRepository.findBrandIdByEmail(email);
  if (existing)
    throw new AppError(409, "Email already registered", "EMAIL_EXISTS");

  const passwordHash = await bcrypt.hash(input.password, 12);
  const slug = await makeUniqueSlug(input.firstName+"-"+input.lastName, brands, brands.slug);

  const brand = await this.brandRepository.insertBrand({
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
  //   const taxonomyIds = await this.brandRepository.findTaxonomyIdsByExternalIds(
  //     input.categoryIds
  //   );
  //   await this.brandRepository.insertTaxonomySelections(brand.id, taxonomyIds);
  //   logger.info(
  //     { brandId: brand.id, count: taxonomyIds.length },
  //     "Taxonomy selections saved"
  //   );
  // }

  const otp = await this.otpRepository.createOtp(email, "email_verify", brand.id);
  await this.mailService.sendOtpEmail(input.email, otp, "email_verify");

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

  async verifyEmailOtp(
  email: string,
  otp: string,
  req?: Request
): Promise<LoginResult> {
  const result = await this.otpRepository.verifyOtp(email, otp, "email_verify");
  if (!result.valid)
    throw new AppError(400, "Invalid or expired OTP", result.reason);

  await this.otpRepository.markOtpUsed(result.record.id);
  const brand = await this.brandRepository.updateBrandByEmail(email, {
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

  await this.brandRepository.insertRefreshToken({
    brandId: brand.id,
    token: refreshToken,
    expiresAt: refreshExpiresAt,
    deviceInfo: { ip: req?.ip, userAgent: req?.headers["user-agent"] },
  });

  await this.brandRepository.updateBrandByEmail(email, {
    lastLoginAt: new Date(),
  });

  await this.brandRepository.insertAuthLog({
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

  async resendOtp(
  email: string,
  purpose: OtpPurpose
): Promise<MessageResult> {
  const brand = await this.brandRepository.findBrandByEmail(email);
  if (!brand) throw new AppError(404, "Account not found", "BRAND_NOT_FOUND");

  const otp = await this.otpRepository.createOtp(email, purpose, brand.id);
  await this.mailService.sendOtpEmail(email, otp, purpose);

  return { message: "OTP sent" };
}

  async forgotPassword(email: string): Promise<MessageResult> {
  const brand = await this.brandRepository.findBrandByEmail(email);
  if (!brand) throw new AppError(401, "Email doesn't exist.", "INVALID_EMAIL");


  const otp = await this.otpRepository.createOtp(email, "forgot_password", brand.id);
  await this.mailService.sendOtpEmail(email, otp, "forgot_password");

  return { message: "OTP has been sent on your email." };
}

  async verifyResetOtp(
  email: string,
  otp: string
): Promise<ResetOtpResult> {
  const result = await this.otpRepository.verifyOtp(email, otp, "forgot_password");
  if (!result.valid)
    throw new AppError(400, "Invalid or expired OTP", result.reason);

  const resetToken = await this.otpRepository.markOtpUsedWithResetToken(result.record.id);
  return { resetToken };
}

  async resetPassword(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<MessageResult> {
  const result = await this.otpRepository.verifyResetToken(email, resetToken);
  if (!result.valid)
    throw new AppError(
      400,
      "Invalid or expired reset token",
      "RESET_TOKEN_INVALID"
    );

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const brand = await this.brandRepository.updateBrandByEmail(email, { passwordHash });

  await this.brandRepository.revokeAllBrandSessions(brand.id);
  await this.brandRepository.insertAuthLog({
    brandId: brand.id,
    email,
    action: "password_reset",
    status: "success",
  });

  return { message: "Password reset successful. Please login again." };
}

  async refreshToken(
  token: string,
  req?: Request
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = await verifyRefreshToken(token).catch(() => {
    throw new AppError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  });

  const storedToken = await this.brandRepository.findActiveRefreshToken(token);
  if (!storedToken) {
    throw new AppError(
      401,
      "Invalid or expired refresh token",
      "INVALID_REFRESH_TOKEN"
    );
  }
  await this.brandRepository.revokeRefreshTokenById(storedToken.id);

  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    type: "brand" as const,
  };

  const accessToken = await signAccessToken(tokenPayload);
  const newRefreshToken = await signRefreshToken(tokenPayload);

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 30);

  await this.brandRepository.insertRefreshToken({
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

  async logout(
  refreshToken: string,
  brandId: string,
  req?: Request
): Promise<LogoutResult> {
  const storedToken = await this.brandRepository.findActiveRefreshToken(refreshToken);
  if (storedToken) {
    await this.brandRepository.revokeRefreshTokenById(storedToken.id);
  }
  await this.brandRepository.insertAuthLog({
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
}
