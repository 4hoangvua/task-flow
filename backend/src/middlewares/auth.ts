import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/errors';

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError(401, 'AUTH_INVALID', 'Authentication token required'));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new AppError(401, 'AUTH_INVALID', 'Authentication token is empty'));
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError(401, 'AUTH_EXPIRED', 'Authentication token has expired'));
      }
      return next(new AppError(401, 'AUTH_INVALID', 'Authentication token is invalid'));
    }
  } catch (error) {
    next(error);
  }
}
