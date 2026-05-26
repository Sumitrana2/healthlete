import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
}

// Maps known error types to appropriate HTTP status codes
function resolveStatusCode(err: Error): number {
  const msg = err.message?.toLowerCase() ?? '';
  const name = err.name?.toLowerCase() ?? '';

  // Database / connection errors
  if (name === 'connectionrefusederror' || msg.includes('econnrefused'))  return 503;
  if (name === 'connectiontimedout'     || msg.includes('timeout'))       return 504;
  if (msg.includes('duplicate key')    || msg.includes('unique constraint')) return 409;
  if (msg.includes('foreign key')      || msg.includes('not-null'))       return 422;

  // Auth errors that slip through as generic Errors
  if (msg.includes('unauthorized') || msg.includes('invalid token'))     return 401;
  if (msg.includes('forbidden'))                                          return 403;

  // Payload / syntax errors (e.g. JSON.parse failure)
  if (err instanceof SyntaxError && msg.includes('json'))                 return 400;

  // Fallback
  return 500;
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
      error: {
        code: err.code ?? 'APP_ERROR',
        message: err.message,
        ...(process.env.NODE_ENV !== 'production' && { details: err.details }),
      },
    });
  }

  // Unexpected error — resolve the right status rather than always 500
  const statusCode = resolveStatusCode(err);
  logger.error({ err, statusCode }, 'Unhandled error');

  return res.status(statusCode).json({
    success: false,
    error: {
      code: resolveErrorCode(statusCode),
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
}

function resolveErrorCode(status: number): string {
  const codes: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE',
    500: 'INTERNAL_ERROR',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT',
  };
  return codes[status] ?? 'INTERNAL_ERROR';
}