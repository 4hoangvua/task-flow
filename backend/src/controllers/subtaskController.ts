import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { createSubtaskSchema, updateSubtaskSchema } from '../utils/validation';

export async function createSubtask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: taskId } = req.params;
    const data = createSubtaskSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
    }

    const subtask = await prisma.subtask.create({
      data: {
        title: data.title,
        taskId,
      },
    });

    // Notify Project Room
    const io = req.app.get('io');
    if (io) {
      io.to(task.projectId).emit('task:updated', { taskId, subtaskCreated: subtask });
    }

    res.status(201).json({
      success: true,
      data: subtask,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateSubtask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateSubtaskSchema.parse(req.body);

    const subtask = await prisma.subtask.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!subtask) {
      return next(new AppError(404, 'NOT_FOUND', 'Subtask not found'));
    }

    // Check project member permission
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    if (req.user.role !== 'ADMIN') {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: subtask.task.projectId,
            userId: req.user.id,
          },
        },
      });
      if (!member) {
        return next(new AppError(403, 'FORBIDDEN', 'Access denied: You are not a member of this project'));
      }

      // If updating title, restrict to leader or assignee
      if (data.title !== undefined) {
        const isAssignee = subtask.task.assigneeId === req.user.id;
        const isLeader = member.role === 'LEADER';
        if (!isAssignee && !isLeader) {
          return next(new AppError(403, 'FORBIDDEN', 'Only the assignee or project leader can edit subtask title'));
        }
      }
    }

    const updatedSubtask = await prisma.subtask.update({
      where: { id },
      data: {
        title: data.title !== undefined ? data.title : undefined,
        isDone: data.isDone !== undefined ? data.isDone : undefined,
      },
    });

    // Notify Project Room
    const io = req.app.get('io');
    if (io) {
      io.to(subtask.task.projectId).emit('task:updated', { taskId: subtask.taskId, subtaskUpdated: updatedSubtask });
    }

    res.status(200).json({
      success: true,
      data: updatedSubtask,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSubtask(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const subtask = await prisma.subtask.findUnique({
      where: { id },
      include: { task: true },
    });

    if (!subtask) {
      return next(new AppError(404, 'NOT_FOUND', 'Subtask not found'));
    }

    // Check project member permission
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    if (req.user.role !== 'ADMIN') {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: subtask.task.projectId,
            userId: req.user.id,
          },
        },
      });
      if (!member) {
        return next(new AppError(403, 'FORBIDDEN', 'Access denied: You are not a member of this project'));
      }

      const isAssignee = subtask.task.assigneeId === req.user.id;
      const isLeader = member.role === 'LEADER';
      if (!isAssignee && !isLeader) {
        return next(new AppError(403, 'FORBIDDEN', 'Only the assignee or project leader can delete subtasks'));
      }
    }

    await prisma.subtask.delete({
      where: { id },
    });

    // Notify Project Room
    const io = req.app.get('io');
    if (io) {
      io.to(subtask.task.projectId).emit('task:updated', { taskId: subtask.taskId, subtaskDeletedId: id });
    }

    res.status(200).json({
      success: true,
      message: 'Subtask deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
