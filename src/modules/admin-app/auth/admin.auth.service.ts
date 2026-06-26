import bcrypt from "bcryptjs";
import { AppError } from "../../../middleware/errorHandler";
import { sendOtpEmail } from "../../../services/email/email.service";
import * as adminRepo from "./admin.auth.repository";
import { AUTH } from "../../../constants/app.constants";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../utils/jwt";
import logger from "../../../config/logger";
import type { Request } from "express";
import type {
  AdminLoginResult,
  MessageResult,
  ResetOtpResult,
} from "./admin.auth.types";

export async function login(
  email: string,
  password: string,
  req?: Request
): Promise<AdminLoginResult> {
  const normalizedEmail = email.toLowerCase().trim();
  const admin = await adminRepo.findAdminByEmail(normalizedEmail);

  if (!admin) {
    await adminRepo.insertAuthLog({
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
    await adminRepo.insertAuthLog({
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
    const updated = await adminRepo.incrementFailedAttempts(normalizedEmail);
    const attempts = updated.failedLoginAttempts ?? 0;

    if (attempts >= AUTH.MAX_FAILED_ATTEMPTS) {
      const lockUntil = new Date(Date.now() + AUTH.LOCK_DURATION_MS);
      await adminRepo.lockAccount(normalizedEmail, lockUntil);
      await adminRepo.insertAuthLog({
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

    await adminRepo.insertAuthLog({
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

  await adminRepo.resetFailedAttempts(normalizedEmail);

  const activeCount = await adminRepo.countActiveSessions(admin.id);
  if (activeCount >= AUTH.MAX_SESSIONS) {
    await adminRepo.revokeOldestSession(admin.id);
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

  await adminRepo.insertRefreshToken({
    adminId: admin.id,
    token: refreshToken,
    expiresAt: refreshExpiresAt,
    deviceInfo: {
      ip: req?.ip,
      userAgent: req?.headers["user-agent"] as string,
    },
  });

  await adminRepo.updateAdminByEmail(normalizedEmail, {
    lastLoginAt: new Date(),
  });

  await adminRepo.insertAuthLog({
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

export async function forgotPassword(email: string): Promise<MessageResult> {
  const admin = await adminRepo.findAdminByEmail(email);
  if (!admin) throw new AppError(401, "Email doesn't exist.", "INVALID_EMAIL");


  const otp = await adminRepo.createOtp(email, "forgot_password", admin.id);
  await sendOtpEmail(email, otp, "forgot_password");

  return { message: "OTP has been sent on your email." };
}

export async function verifyResetOtp(
  email: string,
  otp: string
): Promise<ResetOtpResult> {
  const result = await adminRepo.verifyOtp(email, otp, "forgot_password");
  if (!result.valid)
    throw new AppError(400, "Invalid or expired OTP", result.reason);

  const resetToken = await adminRepo.markOtpUsedWithResetToken(
    result.record.id
  );
  return { resetToken };
}

export async function resetPassword(
  email: string,
  resetToken: string,
  newPassword: string
): Promise<MessageResult> {
  const result = await adminRepo.verifyResetToken(email, resetToken);
  if (!result.valid)
    throw new AppError(
      400,
      "Invalid or expired reset token",
      "RESET_TOKEN_INVALID"
    );

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await adminRepo.updateAdminByEmail(email, { passwordHash });
  await adminRepo.revokeAllAdminSessions(
    (await adminRepo.findAdminByEmail(email))!.id
  );

  await adminRepo.insertAuthLog({
    email,
    action: "password_reset",
    status: "success",
  });

  return { message: "Password reset successful. Please login again." };
}

export async function resendOtp(
  email: string,
  purpose: "email_verify" | "forgot_password"
): Promise<MessageResult> {
  const admin = await adminRepo.findAdminByEmail(email);
  if (!admin) throw new AppError(404, "Account not found", "ADMIN_NOT_FOUND");

  const otp = await adminRepo.createOtp(email, purpose, admin.id);
  await sendOtpEmail(email, otp, purpose);

  return { message: "OTP sent" };
}

export async function refreshToken(
  token: string,
  req?: Request
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = await verifyRefreshToken(token).catch(() => {
    throw new AppError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  });

  const storedToken = await adminRepo.findActiveRefreshToken(token);
  if (!storedToken)
    throw new AppError(
      401,
      "Invalid or expired refresh token",
      "INVALID_REFRESH_TOKEN"
    );

  await adminRepo.revokeRefreshTokenById(storedToken.id);

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

  await adminRepo.insertRefreshToken({
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

export async function logout(
  refreshToken: string,
  adminId: string,
  req?: Request
): Promise<MessageResult> {
  const storedToken = await adminRepo.findActiveRefreshToken(refreshToken);
  if (storedToken) {
    await adminRepo.revokeRefreshTokenById(storedToken.id);
  }

  await adminRepo.insertAuthLog({
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
