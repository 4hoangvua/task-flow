import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

export async function getNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: req.user.id },
      }),
      prisma.notification.count({
        where: { userId: req.user.id, isRead: false },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    const notificationId = req.params.id;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return next(new AppError(404, 'NOT_FOUND', 'Notification not found'));
    }

    if (notification.userId !== req.user.id) {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied'));
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read successfully',
    });
  } catch (error) {
    next(error);
  }
}
