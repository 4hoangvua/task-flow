import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import { prisma } from '../lib/prisma';

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
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
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { isActive: true },
      });

      if (!user || !user.isActive) {
        return next(new AppError(401, 'AUTH_INVALID', 'User account is inactive or not found'));
      }

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
