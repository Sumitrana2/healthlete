import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../middleware/errorHandler";
import logger from "../config/logger";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.brand_access_token; 

    if (!token) {
      throw new AppError(401, "Unauthorized", "NO_TOKEN");
    }
    await verifyAccessToken(token);
    next();
  } catch (error) {
    logger.error({ error }, 'Invalid or expired token');
    next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}