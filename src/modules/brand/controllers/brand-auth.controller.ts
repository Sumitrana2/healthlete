import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request, Response } from "express";
import { BrandAuthService } from "../services/brand-auth.service";
import {
  registerSchema,
  verifyEmailOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  verifyResetOtpSchema,
  resetPasswordSchema,
  loginSchema,
} from "../dto/brand-auth.dto";
import type { RegisterInput, OtpPurpose } from "../types/brand-auth.types";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { clearAuthCookies, setAuthCookies } from "../../../modules/auth/services/cookies.service";
import { AppError } from "../../../common/exceptions/app.error";
import { verifyAccessToken } from "../../../modules/auth/services/jwt.service";
import { ThrottleAuth, ThrottleOtp } from "../../../common/decorators/throttle.decorator";
import { ApiSuccessResponse } from "../../../common/decorators/api-response.decorator";
import { ApiZodBody } from "../../../common/decorators/api-zod-body.decorator";

@ApiTags("Brand Auth")
@Controller("brand/auth")
export class BrandAuthController {
  constructor(private readonly brandAuthService: BrandAuthService) {}

  @Post("login")
  @ThrottleAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Brand login" })
  @ApiZodBody(loginSchema, "BrandLoginBody")
  @ApiSuccessResponse("Login successful")
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: { email: string; password: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.brandAuthService.login(body.email, body.password, req);
    setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken }, "brand");
    return { success: true, message: "Login successful", data: { brand: result.brand } };
  }

  @Post("register")
  @ThrottleAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Brand registration" })
  @ApiZodBody(registerSchema, "BrandRegisterBody")
  @ApiSuccessResponse("Registration successful")
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
    @Res({ passthrough: true }) _res: Response
  ) {
    const result = await this.brandAuthService.register(body);
    return {
      success: true,
      message: "Registration successful. Please verify your email.",
      data: result,
    };
  }

  @Post("verify-email-otp")
  @ThrottleOtp()
  @ApiOperation({ summary: "Verify email OTP" })
  @ApiZodBody(verifyEmailOtpSchema, "BrandVerifyEmailOtpBody")
  @ApiSuccessResponse("Email verified")
  async verifyEmailOtp(
    @Body(new ZodValidationPipe(verifyEmailOtpSchema)) body: { email: string; otp: string },
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.brandAuthService.verifyEmailOtp(body.email, body.otp, req);
    setAuthCookies(res, { accessToken: result.accessToken, refreshToken: result.refreshToken }, "brand");
    return { success: true, message: "Email verified", data: { brand: result.brand } };
  }

  @Post("resend-otp")
  @ThrottleOtp()
  @ApiOperation({ summary: "Resend OTP" })
  @ApiZodBody(resendOtpSchema, "BrandResendOtpBody")
  @ApiSuccessResponse("OTP resent")
  async resendOtp(
    @Body(new ZodValidationPipe(resendOtpSchema)) body: { email: string; purpose: string }
  ) {
    const result = await this.brandAuthService.resendOtp(body.email, body.purpose as OtpPurpose);
    return { success: true, message: result.message, data: result };
  }

  @Post("forgot-password")
  @ThrottleOtp()
  @ApiOperation({ summary: "Forgot password" })
  @ApiZodBody(forgotPasswordSchema, "BrandForgotPasswordBody")
  @ApiSuccessResponse("OTP sent")
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: { email: string }
  ) {
    const result = await this.brandAuthService.forgotPassword(body.email);
    return { success: true, message: result.message, data: result };
  }

  @Post("verify-reset-otp")
  @ThrottleOtp()
  @ApiOperation({ summary: "Verify reset OTP" })
  @ApiZodBody(verifyResetOtpSchema, "BrandVerifyResetOtpBody")
  @ApiSuccessResponse("OTP verified")
  async verifyResetOtp(
    @Body(new ZodValidationPipe(verifyResetOtpSchema)) body: { email: string; otp: string }
  ) {
    const result = await this.brandAuthService.verifyResetOtp(body.email, body.otp);
    return {
      success: true,
      message: "OTP verified. Use reset token to set new password.",
      data: result,
    };
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset password" })
  @ApiZodBody(resetPasswordSchema, "BrandResetPasswordBody")
  @ApiSuccessResponse("Password reset")
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: {
      email: string;
      resetToken: string;
      newPassword: string;
    }
  ) {
    const result = await this.brandAuthService.resetPassword(
      body.email,
      body.resetToken,
      body.newPassword
    );
    return { success: true, message: result.message, data: result };
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token" })
  @ApiSuccessResponse("Token refreshed")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies["brand_refresh_token"];
    if (!token) throw new AppError(401, "No refresh token found", "NO_REFRESH_TOKEN");
    const tokens = await this.brandAuthService.refreshToken(token, req);
    setAuthCookies(res, tokens, "brand");
    return { success: true, message: "Token refreshed", data: {} };
  }

  @Post("logout")
  @ApiOperation({ summary: "Logout" })
  @ApiSuccessResponse("Logged out")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const accessToken = req.cookies["brand_access_token"];
    const refreshToken = req.cookies["brand_refresh_token"];
    let brandId = "";
    if (accessToken) {
      const payload = await verifyAccessToken(accessToken).catch(() => null);
      if (payload) brandId = payload.id;
    }
    if (refreshToken) {
      await this.brandAuthService.logout(refreshToken, brandId, req);
    }
    clearAuthCookies(res, "brand");
    return { success: true, message: "Logged out successfully", data: {} };
  }
}
