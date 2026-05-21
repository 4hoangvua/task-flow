import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

export async function getProjectStats(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    const projectId = req.params.id;

    // Check project existence & membership
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
    }

    const isMember = project.ownerId === req.user!.id || project.members.some((m) => m.userId === req.user!.id);
    if (!isMember && req.user!.role !== 'ADMIN') {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied to this project'));
    }

    // Query tasks
    const tasks = await prisma.task.findMany({
      where: { projectId },
    });

    const total = tasks.length;

    // Counts by status
    const byStatus = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
    };

    // Counts by priority
    const byPriority = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    let overdue = 0;
    const now = new Date();

    for (const t of tasks) {
      if (t.status in byStatus) {
        byStatus[t.status as keyof typeof byStatus]++;
      }
      if (t.priority in byPriority) {
        byPriority[t.priority as keyof typeof byPriority]++;
      }
      if (t.status !== 'DONE' && t.deadline && new Date(t.deadline) < now) {
        overdue++;
      }
    }

    // Recent activity in the project
    const recentActivity = await prisma.taskHistory.findMany({
      where: {
        task: {
          projectId,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus,
        byPriority,
        overdue,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getMySummary(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    const userId = req.user.id;
    const now = new Date();

    const [assigned, completed, overdue] = await prisma.$transaction([
      // Total assigned
      prisma.task.count({
        where: { assigneeId: userId },
      }),
      // Completed tasks
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: 'DONE',
        },
      }),
      // Overdue tasks
      prisma.task.count({
        where: {
          assigneeId: userId,
          status: { not: 'DONE' },
          deadline: { lt: now },
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        assigned,
        completed,
        overdue,
      },
    });
  } catch (error) {
    next(error);
  }
}
