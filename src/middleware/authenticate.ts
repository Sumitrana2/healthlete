import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "./errorHandler";
import { findBrandByEmail } from "../modules/brand-app/auth/brand.repository";
import logger from "../config/logger";

declare global {
  namespace Express {
    interface Request {
      brand?: {
        id: string;
        email: string;
        isOnboardingComplete: boolean | null;
        approvalStatus: string;
      };
    }
  }
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.brand_access_token;

    if (!token) throw new AppError(401, "Unauthorized", "NO_TOKEN");

    const payload = await verifyAccessToken(token);
    if (payload.type !== "brand") {
      throw new AppError(403, "Forbidden", "FORBIDDEN");
    }
    const brand = await findBrandByEmail(payload.email);
    if (!brand) throw new AppError(401, "Account not found", "BRAND_NOT_FOUND");
    if (!brand.isActive)
      throw new AppError(403, "Account deactivated", "ACCOUNT_INACTIVE");

    req.brand = {
      id: brand.id,
      email: brand.email,
      isOnboardingComplete: brand.isOnboardingComplete,
      approvalStatus: brand.approvalStatus!,
    };

    next();
  } catch (error) {
    logger.error({ error }, "Auth middleware error");
    next(
      error instanceof AppError
        ? error
        : new AppError(401, "Invalid or expired token", "INVALID_TOKEN")
    );
  }
}
