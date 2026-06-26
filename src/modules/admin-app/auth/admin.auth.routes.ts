import { Router } from 'express';
import * as authService from './admin.auth.service';
import {
  loginSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  resendOtpSchema,
} from './admin.auth.schema';
import { validate }        from '../../../middleware/validate';
import { setAuthCookies, clearAuthCookies } from '../../../utils/cookies';
import { verifyAccessToken } from '../../../utils/jwt';
import { AppError }        from '../../../middleware/errorHandler';
import { authRateLimiter, otpRateLimiter } from '../../../middleware/rateLimiter';

const router = Router();

router.post('/login', authRateLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req);

    setAuthCookies(res, {
      accessToken:  result.accessToken,
      refreshToken: result.refreshToken,
    }, 'admin');

    res.json({
      success: true,
      message: 'Login successful',
      data:    { admin: result.admin },
    });
  } catch (err) { next(err); }
});

router.post('/forgot-password', otpRateLimiter, validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body.email);
    res.json({ success: true, message: result.message, data: {} });
  } catch (err) { next(err); }
});

router.post('/verify-reset-otp', otpRateLimiter, validate(verifyResetOtpSchema), async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyResetOtp(email, otp);
    res.json({
      success: true,
      message: 'OTP verified. Use reset token to set new password.',
      data:    { resetToken: result.resetToken },
    });
  } catch (err) { next(err); }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    const result = await authService.resetPassword(email, resetToken, newPassword);
    res.json({ success: true, message: result.message, data: {} });
  } catch (err) { next(err); }
});

router.post('/resend-otp', otpRateLimiter, validate(resendOtpSchema), async (req, res, next) => {
  try {
    const { email, purpose } = req.body;
    const result = await authService.resendOtp(email, purpose);
    res.json({ success: true, message: result.message, data: {} });
  } catch (err) { next(err); }
});


router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies['admin_refresh_token'];
    if (!token) throw new AppError(401, 'No refresh token found', 'NO_REFRESH_TOKEN');

    const tokens = await authService.refreshToken(token, req);
    setAuthCookies(res, tokens, 'admin');

    res.json({ success: true, message: 'Token refreshed', data: {} });
  } catch (err) { next(err); }
});


router.post('/logout', async (req, res, next) => {
  try {
    const accessToken  = req.cookies['admin_access_token'];
    const refreshToken = req.cookies['admin_refresh_token'];

    let adminId = '';
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken).catch(() => null);
      if (payload) adminId = payload.id;
    }

    if (refreshToken) {
      await authService.logout(refreshToken, adminId, req);
    }

    clearAuthCookies(res, 'admin');
    res.json({ success: true, message: 'Logged out successfully', data: {} });
  } catch (err) { next(err); }
});

router.get('/me', async (req, res, next) => {
  try {
    const token = req.cookies['admin_access_token'];
    if (!token) throw new AppError(401, 'No token found', 'NO_TOKEN');

    const payload = await verifyAccessToken(token);
    if (payload.type !== 'admin') throw new AppError(403, 'Forbidden', 'FORBIDDEN');

    res.json({
      success: true,
      message: 'Authenticated',
      data: {
        id:    payload.id,
        email: payload.email,
        type:  payload.type,
      },
    });
  } catch (err) { next(err); }
});

export default router;