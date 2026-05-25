import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { createLabelSchema, updateLabelSchema } from '../utils/validation';

export async function getLabels(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId || req.params.id;

    const labels = await prisma.label.findMany({
      where: { projectId },
    });

    res.status(200).json({
      success: true,
      data: labels,
    });
  } catch (error) {
    next(error);
  }
}

export async function createLabel(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId || req.params.id;
    const data = createLabelSchema.parse(req.body);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
    }

    const label = await prisma.label.create({
      data: {
        name: data.name,
        color: data.color,
        projectId,
      },
    });

    // Emit Socket Update
    const io = req.app.get('io');
    if (io) {
      io.to(projectId).emit('project:updated', { projectId, labelCreated: label });
    }

    res.status(201).json({
      success: true,
      data: label,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateLabel(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateLabelSchema.parse(req.body);

    const label = await prisma.label.findUnique({
      where: { id },
    });

    if (!label) {
      return next(new AppError(404, 'NOT_FOUND', 'Label not found'));
    }

    // Verify Project Leader or System Admin
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    if (req.user.role !== 'ADMIN') {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: label.projectId,
            userId: req.user.id,
          },
        },
      });
      if (member?.role !== 'LEADER') {
        return next(new AppError(403, 'FORBIDDEN', 'Only project leaders can update labels'));
      }
    }

    const updatedLabel = await prisma.label.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : undefined,
        color: data.color !== undefined ? data.color : undefined,
      },
    });

    // Emit Socket Update
    const io = req.app.get('io');
    if (io) {
      io.to(label.projectId).emit('project:updated', { projectId: label.projectId, labelUpdated: updatedLabel });
    }

    res.status(200).json({
      success: true,
      data: updatedLabel,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteLabel(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const label = await prisma.label.findUnique({
      where: { id },
    });

    if (!label) {
      return next(new AppError(404, 'NOT_FOUND', 'Label not found'));
    }

    // Verify Project Leader or System Admin
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    if (req.user.role !== 'ADMIN') {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: label.projectId,
            userId: req.user.id,
          },
        },
      });
      if (member?.role !== 'LEADER') {
        return next(new AppError(403, 'FORBIDDEN', 'Only project leaders can delete labels'));
      }
    }

    await prisma.label.delete({
      where: { id },
    });

    // Emit Socket Update
    const io = req.app.get('io');
    if (io) {
      io.to(label.projectId).emit('project:updated', { projectId: label.projectId, labelDeletedId: id });
    }

    res.status(200).json({
      success: true,
      message: 'Label deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
