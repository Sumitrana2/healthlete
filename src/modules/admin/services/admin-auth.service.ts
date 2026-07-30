import { Injectable } from "@nestjs/common";
import { AdminAuthRepository } from "../repositories/admin-auth.repository";
import bcrypt from "bcryptjs";
import { AppError } from "../../../common/exceptions/app.error";
import { MailService } from "../../../shared/mail/mail.service";
import { AUTH } from "../../../common/constants/app.constants";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../modules/auth/services/jwt.service";
import logger from "../../../shared/logger/logger";
import type { Request } from "express";
import type {
  AdminLoginResult,
  MessageResult,
  ResetOtpResult,
} from "../types/admin-auth.types";

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly adminRepository: AdminAuthRepository,
    private readonly mailService: MailService,
  ) {}

  async login(
  email: string,
  password: string,
  req?: Request
): Promise<AdminLoginResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const admin = await this.adminRepository.findAdminByEmail(normalizedEmail);

  if (!admin) {
    await this.adminRepository.insertAuthLog({
      email: normalizedEmail,
      action: "login",
      status: "failed",
      ip: req?.ip,
      userAgent: req?.headers["user-agent"],
      details: { reason: "admin_not_found" },
    });
    throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }

  if (admin.lockedUntil && admin.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil(
      (admin.lockedUntil.getTime() - Date.now()) / 60000
    );
    await this.adminRepository.insertAuthLog({
      adminId: admin.id,
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

  if (!admin.isActive) {
    throw new AppError(403, "Account deactivated", "ACCOUNT_INACTIVE");
  }

  const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

  if (!isPasswordValid) {
    const updated = await this.adminRepository.incrementFailedAttempts(normalizedEmail);
    const attempts = updated.failedLoginAttempts ?? 0;

    if (attempts >= AUTH.MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + AUTH.LOCK_DURATION_MS);
      await this.adminRepository.lockAccount(normalizedEmail, lockUntil);
      await this.adminRepository.insertAuthLog({
        adminId: admin.id,
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

    await this.adminRepository.insertAuthLog({
      adminId: admin.id,
      email: normalizedEmail,
      action: "login",
      status: "failed",
      ip: req?.ip,
      userAgent: req?.headers["user-agent"],
      details: {
        reason: "wrong_password",
        attemptsLeft: AUTH.MAX_FAILED_ATTEMPTS - attempts,
      },
    });
    throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }

  await this.adminRepository.resetFailedAttempts(normalizedEmail);

  const activeCount = await this.adminRepository.countActiveSessions(admin.id);
  if (activeCount >= AUTH.MAX_SESSIONS) {
    await this.adminRepository.revokeOldestSession(admin.id);
  }

  const tokenPayload = {
    id: admin.id,
    email: admin.email,
    type: "admin" as const,
  };

  const accessToken = await signAccessToken(tokenPayload);
  const refreshToken = await signRefreshToken(tokenPayload);

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(
    refreshExpiresAt.getDate() + AUTH.REFRESH_EXPIRES_DAYS
  );

  await this.adminRepository.insertRefreshToken({
    adminId: admin.id,
    token: refreshToken,
    expiresAt: refreshExpiresAt,
    deviceInfo: {
      ip: req?.ip,
      userAgent: req?.headers["user-agent"] as string,
    },
  });

  await this.adminRepository.updateAdminByEmail(normalizedEmail, {
    lastLoginAt: new Date(),
  });

  await this.adminRepository.insertAuthLog({
    adminId: admin.id,
    email: normalizedEmail,
    action: "login",
    status: "success",
    ip: req?.ip,
    userAgent: req?.headers["user-agent"],
  });

  logger.info({ adminId: admin.id }, "Admin logged in");

  return {
    admin: {
      id: admin.id,
      email: admin.email,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      isSuperAdmin: admin.isSuperAdmin,
    },
    accessToken,
    refreshToken,
  };
}

  async forgotPassword(email: string): Promise<MessageResult> {
  const admin = await this.adminRepository.findAdminByEmail(email);
  if (!admin) throw new AppError(401, "Email doesn't exist.", "INVALID_EMAIL");


  const otp = await this.adminRepository.createOtp(email, "forgot_password", admin.id);
  await this.mailService.sendOtpEmail(email, otp, "forgot_password");

  return { message: "OTP has been sent on your email." };
}

  async verifyResetOtp(
  email: string,
  otp: string
): Promise<ResetOtpResult> {
  const result = await this.adminRepository.verifyOtp(email, otp, "forgot_password");
  if (!result.valid)
    throw new AppError(400, "Invalid or expired OTP", result.reason);

  const resetToken = await this.adminRepository.markOtpUsedWithResetToken(
    result.record.id
  );
  return { resetToken };
}

  async resetPassword(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<MessageResult> {
  const result = await this.adminRepository.verifyResetToken(email, resetToken);
  if (!result.valid)
    throw new AppError(
      400,
      "Invalid or expired reset token",
      "RESET_TOKEN_INVALID"
    );

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await this.adminRepository.updateAdminByEmail(email, { passwordHash });
  await this.adminRepository.revokeAllAdminSessions(
    (await this.adminRepository.findAdminByEmail(email))!.id
  );

  await this.adminRepository.insertAuthLog({
    email,
    action: "password_reset",
    status: "success",
  });

  return { message: "Password reset successful. Please login again." };
}

  async resendOtp(
  email: string,
  purpose: "email_verify" | "forgot_password"
): Promise<MessageResult> {
  const admin = await this.adminRepository.findAdminByEmail(email);
  if (!admin) throw new AppError(404, "Account not found", "ADMIN_NOT_FOUND");

  const otp = await this.adminRepository.createOtp(email, purpose, admin.id);
  await this.mailService.sendOtpEmail(email, otp, purpose);

  return { message: "OTP sent" };
}

  async refreshToken(
  token: string,
  req?: Request
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = await verifyRefreshToken(token).catch(() => {
    throw new AppError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  });

  const storedToken = await this.adminRepository.findActiveRefreshToken(token);
  if (!storedToken)
    throw new AppError(
      401,
      "Invalid or expired refresh token",
      "INVALID_REFRESH_TOKEN"
    );

  await this.adminRepository.revokeRefreshTokenById(storedToken.id);

  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    type: "admin" as const,
  };

  const accessToken = await signAccessToken(tokenPayload);
  const newRefreshToken = await signRefreshToken(tokenPayload);

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(
    refreshExpiresAt.getDate() + AUTH.REFRESH_EXPIRES_DAYS
  );

  await this.adminRepository.insertRefreshToken({
    adminId: payload.id,
    token: newRefreshToken,
    expiresAt: refreshExpiresAt,
    deviceInfo: {
      ip: req?.ip,
      userAgent: req?.headers["user-agent"] as string,
    },
  });

  logger.info({ adminId: payload.id }, "Admin token refreshed");

  return { accessToken, refreshToken: newRefreshToken };
}

  async logout(
  refreshToken: string,
  adminId: string,
  req?: Request
): Promise<MessageResult> {
  const storedToken = await this.adminRepository.findActiveRefreshToken(refreshToken);
  if (storedToken) {
    await this.adminRepository.revokeRefreshTokenById(storedToken.id);
  }

  await this.adminRepository.insertAuthLog({
    adminId,
    email: "",
    action: "logout",
    status: "success",
    ip: req?.ip,
    userAgent: req?.headers["user-agent"],
  });

  logger.info({ adminId }, "Admin logged out");

  return { message: "Logged out successfully" };
}
}
