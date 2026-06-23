import { Router } from "express";
import * as authService from "./brand.auth.service";
import {
  registerSchema,
  verifyEmailOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  loginSchema
} from "./brand.auth.schema";
import { validate } from "../../../middleware/validate";
import { setAuthCookies } from "../../../utils/cookies";
const router = Router();

router.post("/login", validate(loginSchema), async (req, res, next) => {
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

    res.json({ success: true, data: { brand: result.brand } });
  } catch (err) {
    next(err);
  }
});

router.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/verify-email-otp",
  validate(verifyEmailOtpSchema),
  async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyEmailOtp(email, otp);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/resend-otp",
  validate(resendOtpSchema),
  async (req, res, next) => {
    try {
      const { email, purpose } = req.body;
      const result = await authService.resendOtp(email, purpose);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/verify-reset-otp",
  validate(verifyResetOtpSchema),
  async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyResetOtp(email, otp);
      res.json({ success: true, data: result });
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
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
