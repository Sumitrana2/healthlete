import { Controller, Post, Get, Body, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { AdminAuthService } from "../services/admin-auth.service";
import {
  loginSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  resendOtpSchema,
} from "../dto/admin-auth.dto";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { setAuthCookies, clearAuthCookies } from "../../../modules/auth/services/cookies.service";
import { verifyAccessToken } from "../../../modules/auth/services/jwt.service";
import { AppError } from "../../../common/exceptions/app.error";
import { ThrottleAuth, ThrottleOtp } from "../../../common/decorators/throttle.decorator";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";
import { ApiZodBody } from "../../../common/decorators/api-zod-body.decorator";

@ApiTags("Admin Auth")
@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post("login")
  @ThrottleAuth()
  @ApiOperation({ summary: "Admin login" })
  @ApiZodBody(loginSchema, "AdminLoginBody")
  @ApiSuccessResponse("Login successful")
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.adminAuthService.login(body.email, body.password, req);
    setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken }, "admin");
    return { success: true, message: "Login successful", data: { admin: result.admin, accessToken: result.accessToken } };
  }

  @Post("forgot-password")
  @ThrottleOtp()
  @ApiOperation({ summary: "Forgot password" })
  @ApiZodBody(forgotPasswordSchema, "AdminForgotPasswordBody")
  @ApiSuccessResponse("OTP sent")
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: { email: string }
  ) {
    const result = await this.adminAuthService.forgotPassword(body.email);
    return { success: true, message: result.message, data: {} };
  }

  @Post("verify-reset-otp")
  @ThrottleOtp()
  @ApiOperation({ summary: "Verify reset OTP" })
  @ApiZodBody(verifyResetOtpSchema, "AdminVerifyResetOtpBody")
  @ApiSuccessResponse("OTP verified")
  async verifyResetOtp(
    @Body(new ZodValidationPipe(verifyResetOtpSchema)) body: { email: string; otp: string }
  ) {
    const result = await this.adminAuthService.verifyResetOtp(body.email, body.otp);
    return {
      success: true,
      message: "OTP verified. Use reset token to set new password.",
      data: { resetToken: result.resetToken },
    };
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password" })
  @ApiZodBody(resetPasswordSchema, "AdminResetPasswordBody")
  @ApiSuccessResponse("Password reset")
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: {
      email: string;
      resetToken: string;
      newPassword: string;
    }
  ) {
    const result = await this.adminAuthService.resetPassword(
      body.email,
      body.resetToken,
      body.newPassword
    );
    return { success: true, message: result.message, data: {} };
  }

  @Post("resend-otp")
  @ThrottleOtp()
  @ApiOperation({ summary: "Resend OTP" })
  @ApiZodBody(resendOtpSchema, "AdminResendOtpBody")
  @ApiSuccessResponse("OTP resent")
  async resendOtp(
    @Body(new ZodValidationPipe(resendOtpSchema)) body: { email: string; purpose: string }
  ) {
    const result = await this.adminAuthService.resendOtp(
      body.email,
      body.purpose as "email_verify" | "forgot_password"
    );
    return { success: true, message: result.message, data: {} };
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiSuccessResponse("Token refreshed")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies["admin_refresh_token"];
    if (!token) throw new AppError(401, "No refresh token found", "NO_REFRESH_TOKEN");
    const tokens = await this.adminAuthService.refreshToken(token, req);
    setAuthCookies(res, tokens, "admin");
    return { success: true, message: "Token refreshed", data: {} };
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout" })
  @ApiSuccessResponse("Logged out")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = req.cookies["admin_access_token"];
    const refreshToken = req.cookies["admin_refresh_token"];
    let adminId = "";
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken).catch(() => null);
      if (payload) adminId = payload.id;
    }
    if (refreshToken) {
      await this.adminAuthService.logout(refreshToken, adminId, req);
    }
    clearAuthCookies(res, "admin");
    return { success: true, message: "Logged out successfully", data: {} };
  }

  @Get("me")
  @ApiOperation({ summary: "Get current admin" })
  @ApiSuccessResponse("Authenticated")
  async me(@Req() req: Request) {
    const token = req.cookies["admin_access_token"];
    if (!token) throw new AppError(401, "No token found", "NO_TOKEN");
    const payload = await verifyAccessToken(token);
    if (payload.type !== "admin") throw new AppError(403, "Forbidden", "FORBIDDEN");
    return {
      success: true,
      message: "Authenticated",
      data: { id: payload.id, email: payload.email, type: payload.type },
    };
  }
}
