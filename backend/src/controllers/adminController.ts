import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

export async function getSystemUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page) || 1 : 1;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit) || 10 : 10;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const role = typeof req.query.role === 'string' ? req.query.role : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (status && status !== 'ALL') {
      where.isActive = status === 'ACTIVE';
    }

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserSystemRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['ADMIN', 'LEADER', 'MEMBER'].includes(role)) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid role specified'));
    }

    if (req.user?.id === id) {
      return next(new AppError(400, 'FORBIDDEN', 'You cannot change your own system role'));
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUserActiveStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined || typeof isActive !== 'boolean') {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Invalid active status specified'));
    }

    if (req.user?.id === id) {
      return next(new AppError(400, 'FORBIDDEN', 'You cannot change your own active status'));
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSystemStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalUsers,
      totalProjects,
      totalTasks,
      activeLeaders,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.project.count(),
      prisma.task.count(),
      prisma.user.count({ where: { role: 'LEADER' } }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProjects,
        totalTasks,
        activeLeaders,
        systemStatus: 'HEALTHY'
      }
    });
  } catch (error) {
    next(error);
  }
}
