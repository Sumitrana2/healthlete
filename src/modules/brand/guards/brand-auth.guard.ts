import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";
import { verifyAccessToken } from "../../auth/services/jwt.service";
import { BrandRepository } from "../repositories/brand.repository";
import { AppError } from "../../../common/exceptions/app.error";
import logger from "../../../shared/logger/logger";

export interface BrandRequestUser {
  id: string;
  email: string;
  isOnboardingComplete: boolean | null;
  approvalStatus: string;
}

@Injectable()
export class BrandAuthGuard implements CanActivate {
  constructor(private readonly brandRepository: BrandRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { brand?: BrandRequestUser }>();

    try {
      const token = request.cookies?.brand_access_token;
      if (!token) throw new AppError(401, "Unauthorized", "NO_TOKEN");

      const payload = await verifyAccessToken(token);
      if (payload.type !== "brand") {
        throw new AppError(403, "Forbidden", "FORBIDDEN");
      }

      const brand = await this.brandRepository.findBrandByEmail(payload.email);
      if (!brand) throw new AppError(401, "Account not found", "BRAND_NOT_FOUND");
      if (!brand.isActive) {
        throw new AppError(403, "Account deactivated", "ACCOUNT_INACTIVE");
      }

      request.brand = {
        id: brand.id,
        email: brand.email,
        isOnboardingComplete: brand.isOnboardingComplete,
        approvalStatus: brand.approvalStatus!,
      };

      return true;
    } catch (error) {
      logger.error({ error }, "Brand auth guard error");
      throw error instanceof AppError
        ? error
        : new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
    }
  }
}
