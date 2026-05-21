import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.name === 'ZodError' || (err.issues && Array.isArray(err.issues))) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.issues || err.errors;
  } else if (err.code && typeof err.code === 'string' && err.code.startsWith('P')) {
    statusCode = 400;
    code = 'DATABASE_ERROR';
    message = 'Database operation failed';
    details = err.message;
  } else {
    message = err.message || message;
  }

  logger.error(`${req.method} ${req.path} - ${statusCode} - ${code} - ${message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    logger.debug(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code,
    ...(details && { details }),
  });
}
