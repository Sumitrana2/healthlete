import { Router } from "express";
import * as authService from "./brand.auth.service";
import {
  registerSchema,
  verifyEmailOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  loginSchema,
} from "./brand.auth.schema";
import { validate } from "../../../middleware/validate";
import { clearAuthCookies, setAuthCookies } from "../../../utils/cookies";
import { AppError } from "../../../middleware/errorHandler";
import {
  authRateLimiter,
  otpRateLimiter,
} from "../../../middleware/rateLimiter";
import { verifyAccessToken } from "../../../utils/jwt";

const router = Router();

router.post(
  "/login",
  authRateLimiter,
  validate(loginSchema),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password, req);

      setAuthCookies(
        res,
        {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        "brand"
      );

      res.json({
        success: true,
        message: "Login successful",
        data: { brand: result.brand },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        success: true,
        message: "Registration successful. Please verify your email.",
        data:    result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/verify-email-otp",
  otpRateLimiter,
  validate(verifyEmailOtpSchema),
  async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyEmailOtp(email, otp, req);
      setAuthCookies(
        res,
        {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        "brand"
      );
      res.json({
        success: true,
        message: "Email verified",
        data:    { brand: result.brand },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/resend-otp",
  otpRateLimiter,
  validate(resendOtpSchema),
  async (req, res, next) => {
    try {
      const { email, purpose } = req.body;
      const result = await authService.resendOtp(email, purpose);
      res.json({
        success: true,
        message: result.message,
        data:    result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/forgot-password",
  otpRateLimiter,
  validate(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      res.json({
        success: true,
        message: result.message,
        data:    result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/verify-reset-otp",
  otpRateLimiter,
  validate(verifyResetOtpSchema),
  async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyResetOtp(email, otp);
      res.json({
        success: true,
        message: "OTP verified. Use reset token to set new password.",
        data:   result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const { email, resetToken, newPassword } = req.body;
      const result = await authService.resetPassword(
        email,
        resetToken,
        newPassword
      );
      res.json({
        success: true,
        message: result.message,
        data:    result,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/refresh", async (req, res, next) => {
  try {
    const token = req.cookies["brand_refresh_token"];
    if (!token) {
      throw new AppError(401, "No refresh token found", "NO_REFRESH_TOKEN");
    }
    const tokens = await authService.refreshToken(token, req);
    setAuthCookies(res, tokens, "brand");
    res.json({
      success: true,
      message: "Token refreshed",
      data:    {},
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    const accessToken = req.cookies["brand_access_token"];
    const refreshToken = req.cookies["brand_refresh_token"];
    let brandId = "";
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken).catch(() => null);
      if (payload) brandId = payload.id;
    }
    if (refreshToken) {
      await authService.logout(refreshToken, brandId, req);
    }
    clearAuthCookies(res, "brand");
    res.json({
      success: true,
      message: "Logged out successfully",
      data:    {},
    });
  } catch (err) {
    next(err);
  }
});

export default router;
