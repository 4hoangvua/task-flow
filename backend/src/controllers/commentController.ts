import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { createCommentSchema } from '../utils/validation';

export async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    const user = req.user;
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
          userId: user.id,
        },
      },
    });

    if (!member && user.role !== 'ADMIN') {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied to this project'));
    }

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
      orderBy: { createdAt: 'asc' }, // Sort oldest first so threads read naturally
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
    const user = req.user;
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
          userId: user.id,
        },
      },
    });

    if (!member && user.role !== 'ADMIN') {
      return next(new AppError(403, 'FORBIDDEN', 'Access denied to this project'));
    }

    // Validate and flatten parentId down to max 2 levels (thread logic)
    let parentIdToUse = data.parentId || null;
    let parentCommentAuthorId: string | null = null;
    if (parentIdToUse) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentIdToUse },
        select: { parentId: true, userId: true },
      });
      if (!parentComment) {
        return next(new AppError(404, 'NOT_FOUND', 'Parent comment not found'));
      }
      parentCommentAuthorId = parentComment.userId;
      
      // Prevent replying to own comment
      if (parentComment.userId === user.id) {
        return next(new AppError(400, 'VALIDATION_ERROR', 'Bạn không thể tự trả lời bình luận của chính mình'));
      }

      // If the parent comment is itself a reply, point to the root comment instead
      if (parentComment.parentId) {
        parentIdToUse = parentComment.parentId;
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        taskId,
        userId: user.id,
        parentId: parentIdToUse,
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
      if (task.assigneeId && task.assigneeId !== user.id) {
        recipients.add(task.assigneeId);
      }
      if (task.creatorId && task.creatorId !== user.id) {
        recipients.add(task.creatorId);
      }
      // Also notify parent comment author if they are not the reply author
      if (parentCommentAuthorId && parentCommentAuthorId !== user.id) {
        recipients.add(parentCommentAuthorId);
      }

      for (const userId of recipients) {
        const isReplyToThem = parentCommentAuthorId === userId;
        const notification = await prisma.notification.create({
          data: {
            userId,
            type: 'COMMENT_ADDED',
            title: isReplyToThem ? 'Phản hồi bình luận mới' : 'Bình luận mới',
            message: isReplyToThem 
              ? `"${comment.user.name}" đã phản hồi bình luận của bạn trong: "${task.title}"`
              : `"${comment.user.name}" đã bình luận trên công việc: "${task.title}"`,
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
    const user = req.user;
    const commentId = req.params.id;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: {
          select: { projectId: true },
        },
      },
    });

    if (!comment) {
      return next(new AppError(404, 'NOT_FOUND', 'Comment not found'));
    }

    // Only creator of comment, ADMIN, or Project LEADER can delete
    let isAllowed = comment.userId === user.id || user.role === 'ADMIN';

    if (!isAllowed && comment.task) {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: comment.task.projectId,
            userId: user.id,
          },
        },
      });
      if (member?.role === 'LEADER') {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return next(new AppError(403, 'FORBIDDEN', 'Only the comment author or project leader can delete it'));
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Emit socket event for realtime update
    const io = req.app.get('io');
    if (io && comment.task) {
      io.to(comment.task.projectId).emit('comment:deleted', { taskId: comment.taskId, commentId });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}
