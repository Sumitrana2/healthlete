import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "./errorHandler";
import { findAdminByEmail } from "../modules/admin-app/auth/admin.auth.repository";
import logger from "../config/logger";

declare global {
  namespace Express {
    interface Request {
      admin?: {
        id:             string;
        email:          string;
      };
    }
  }
}

export async function adminAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.admin_access_token;

    if (!token) throw new AppError(401, "Unauthorized", "NO_TOKEN");

    const payload = await verifyAccessToken(token);
    if (payload.type !== 'admin') {
      throw new AppError(403, "Forbidden", "FORBIDDEN");
    }
    const admin = await findAdminByEmail(payload.email);
    if (!admin)        throw new AppError(401, "Account not found", "Admin_NOT_FOUND");
    if (!admin.isActive) throw new AppError(403, "Account deactivated", "ACCOUNT_INACTIVE");

    req.admin = {
      id:             admin.id,
      email:          admin.email,
    };

    next();
  } catch (error) {
    logger.error({ error }, 'Auth middleware error');
    next(error instanceof AppError ? error : new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}