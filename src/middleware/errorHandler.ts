import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    code: "NOT_FOUND",
    errors: null,
  });
}

function resolveStatusCode(err: Error): number {
  const msg = err.message?.toLowerCase() ?? "";
  const name = err.name?.toLowerCase() ?? "";

  if (name === "connectionrefusederror" || msg.includes("econnrefused"))
    return 503;
  if (name === "connectiontimedout" || msg.includes("timeout")) return 504;
  if (msg.includes("duplicate key") || msg.includes("unique constraint"))
    return 409;
  if (msg.includes("foreign key") || msg.includes("not-null")) return 422;
  if (msg.includes("unauthorized") || msg.includes("invalid token")) return 401;
  if (msg.includes("forbidden")) return 403;
  if (err instanceof SyntaxError && msg.includes("json")) return 400;
  return 500;
}

function resolveErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    409: "CONFLICT",
    422: "UNPROCESSABLE",
    500: "INTERNAL_ERROR",
    503: "SERVICE_UNAVAILABLE",
    504: "GATEWAY_TIMEOUT",
  };
  return codes[status] ?? "INTERNAL_ERROR";
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code ?? "APP_ERROR",
      errors: process.env.NODE_ENV !== "production" ? err.details : null,
    });
  }

  const statusCode = resolveStatusCode(err);
  logger.error({ err, statusCode }, "Unhandled error");

  return res.status(statusCode).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
    code: resolveErrorCode(statusCode),
    errors: null,
  });
}
