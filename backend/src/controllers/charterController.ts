import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { updateCharterSchema } from '../utils/validation';

export async function getCharter(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId || req.params.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
    }

    // Upsert: return existing or create empty charter
    const charter = await prisma.teamCharter.upsert({
      where: { projectId },
      create: { projectId },
      update: {},
    });

    res.status(200).json({
      success: true,
      data: charter,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCharter(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const projectId = req.params.projectId || req.params.id;
    const data = updateCharterSchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
    }

    // RBAC: Only LEADER or ADMIN can update
    if (req.user.role !== 'ADMIN') {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });
      if (member?.role !== 'LEADER') {
        return next(new AppError(403, 'FORBIDDEN', 'Only project leaders can update team charter'));
      }
    }

    const charter = await prisma.teamCharter.upsert({
      where: { projectId },
      create: {
        projectId,
        ...data,
      },
      update: {
        ...data,
      },
    });

    // Emit Socket Update
    const io = req.app.get('io');
    if (io) {
      io.to(projectId).emit('project:updated', { projectId, charterUpdated: charter });
    }

    res.status(200).json({
      success: true,
      data: charter,
    });
  } catch (error) {
    next(error);
  }
}
