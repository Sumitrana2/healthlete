import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AppError } from "../exceptions/app.error";
import logger from "../../shared/logger/logger";

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

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof AppError) {
      return response.status(exception.statusCode).json({
        success: false,
        message: exception.message,
        code: exception.code ?? "APP_ERROR",
        errors:
          process.env.NODE_ENV !== "production" ? exception.details : null,
      });
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === "string"
          ? body
          : ((body as Record<string, unknown>).message ?? exception.message);

      return response.status(status).json({
        success: false,
        message: Array.isArray(message) ? message[0] : message,
        code: resolveErrorCode(status),
        errors: null,
      });
    }

    const err = exception instanceof Error ? exception : new Error(String(exception));
    const statusCode = resolveStatusCode(err);
    logger.error(
      { err, statusCode, path: request.url, method: request.method },
      "Unhandled error"
    );

    return response.status(statusCode).json({
      success: false,
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message,
      code: resolveErrorCode(statusCode),
      errors: null,
    });
  }
}
