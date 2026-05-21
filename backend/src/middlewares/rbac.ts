import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';

export function requireSystemRole(roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'AUTH_INVALID', 'Authentication required'));
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied: Insufficient permissions'));
    }

    next();
  };
}

export function requireProjectRole(allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'AUTH_INVALID', 'Authentication required'));
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    const projectId = req.params.projectId || req.params.id || req.body.projectId || req.query.projectId;
    if (!projectId || typeof projectId !== 'string') {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Project ID is missing from request'));
    }

    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });

      if (!project) {
        return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
      }

      if (project.ownerId === req.user.id) {
        return next();
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });

      if (!member) {
        return next(new AppError(403, 'FORBIDDEN', 'Access denied: You are not a member of this project'));
      }

      if (!allowedRoles.includes(member.role)) {
        return next(new AppError(403, 'FORBIDDEN', 'Access denied: Insufficient role in project'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireTaskProjectRole(allowedRoles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'AUTH_INVALID', 'Authentication required'));
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    const taskId = req.params.id || req.body.taskId || req.query.taskId;
    if (!taskId || typeof taskId !== 'string') {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Task ID is missing from request'));
    }

    try {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true },
      });

      if (!task) {
        return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
      }

      const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        select: { ownerId: true },
      });

      if (!project) {
        return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
      }

      if (project.ownerId === req.user.id) {
        return next();
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId: req.user.id,
          },
        },
      });

      if (!member) {
        return next(new AppError(403, 'FORBIDDEN', 'Access denied: You are not a member of this project'));
      }

      if (!allowedRoles.includes(member.role)) {
        return next(new AppError(403, 'FORBIDDEN', 'Access denied: Insufficient role in project'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

