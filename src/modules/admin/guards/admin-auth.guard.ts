import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Request } from "express";
import { verifyAccessToken } from "../../auth/services/jwt.service";
import { AdminAuthRepository } from "../repositories/admin-auth.repository";
import { AppError } from "../../../common/exceptions/app.error";
import { extractAccessToken } from "../../../common/utils/extract-access-token";
import logger from "../../../shared/logger/logger";

export interface AdminRequestUser {
  id: string;
  email: string;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly adminRepository: AdminAuthRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { admin?: AdminRequestUser }>();

    try {
      const token = extractAccessToken(request, "admin_access_token");
      if (!token) throw new AppError(401, "Unauthorized", "NO_TOKEN");

      const payload = await verifyAccessToken(token);
      if (payload.type !== "admin") {
        throw new AppError(403, "Forbidden", "FORBIDDEN");
      }

      const admin = await this.adminRepository.findAdminByEmail(payload.email);
      if (!admin) throw new AppError(401, "Account not found", "Admin_NOT_FOUND");
      if (!admin.isActive) {
        throw new AppError(403, "Account deactivated", "ACCOUNT_INACTIVE");
      }

      request.admin = {
        id: admin.id,
        email: admin.email,
      };

      return true;
    } catch (error) {
      logger.error({ error }, "Admin auth guard error");
      throw error instanceof AppError
        ? error
        : new AppError(401, "Invalid or expired token", "INVALID_TOKEN");
    }
  }
}
