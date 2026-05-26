import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { createCommentSchema } from '../utils/validation';

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    const taskId = req.params.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
    }

    // Check project membership
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: req.user.id,
        },
      },
    });

    if (!member && req.user.role !== 'ADMIN') {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied to this project'));
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    const taskId = req.params.id;

    const data = createCommentSchema.parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
    }

    // Check project membership
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: req.user.id,
        },
      },
    });

    if (!member && req.user.role !== 'ADMIN') {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied to this project'));
    }

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        taskId,
        userId: req.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    // Realtime Emit
    const io = req.app.get('io');
    if (io) {
      io.to(task.projectId).emit('comment:added', { taskId, comment });

      // Notifications logic
      const recipients = new Set<string>();
      if (task.assigneeId && task.assigneeId !== req.user.id) {
        recipients.add(task.assigneeId);
      }
      if (task.creatorId && task.creatorId !== req.user.id) {
        recipients.add(task.creatorId);
      }

      for (const userId of recipients) {
        const notification = await prisma.notification.create({
          data: {
            userId,
            type: 'COMMENT_ADDED',
            title: 'Bình luận mới',
            message: `"${comment.user.name}" đã bình luận trên công việc: "${task.title}"`,
            taskId: task.id,
            projectId: task.projectId,
          },
        });
        io.to(`user:${userId}`).emit('notification', notification);
      }
    }

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    const commentId = req.params.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return next(new AppError(404, 'NOT_FOUND', 'Comment not found'));
    }

    // Only creator of comment, ADMIN, or Project LEADER can delete
    let isAllowed = comment.userId === req.user.id || req.user.role === 'ADMIN';

    if (!isAllowed) {
      const task = await prisma.task.findUnique({
        where: { id: comment.taskId },
        select: { projectId: true },
      });
      if (task) {
        const member = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId: task.projectId,
              userId: req.user.id,
            },
          },
        });
        if (member?.role === 'LEADER') {
          isAllowed = true;
        }
      }
    }

    if (!isAllowed) {
      return next(new AppError(403, 'FORBIDDEN', 'Only the comment author or project leader can delete it'));
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
