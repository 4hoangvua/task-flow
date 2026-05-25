import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema, reorderTasksSchema } from '../utils/validation';

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string;
    if (!projectId) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Project ID is required'));
    }

    const status = req.query.status as string | undefined;
    const assigneeId = req.query.assigneeId as string | undefined;
    const priority = req.query.priority as any | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const whereClause: any = { projectId };

    if (status) whereClause.status = status;
    if (assigneeId) whereClause.assigneeId = assigneeId;
    if (priority) whereClause.priority = priority;

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where: whereClause,
        include: {
          assignee: { select: { id: true, name: true, email: true, avatar: true } },
          creator: { select: { id: true, name: true, email: true, avatar: true } },
          labels: { select: { id: true, name: true, color: true } },
          subtasks: true,
        },
        orderBy: [
          { status: 'asc' },
          { order: 'asc' },
        ],
        skip,
        take: limit,
      }),
      prisma.task.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: tasks,
      meta: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const data = createTaskSchema.parse(req.body);

    // Calculate next order in the column
    const taskCount = await prisma.task.count({
      where: {
        projectId: data.projectId,
        status: 'TODO',
      },
    });

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: 'TODO',
        priority: data.priority || 'MEDIUM',
        order: taskCount,
        deadline: data.deadline ? new Date(data.deadline) : null,
        projectId: data.projectId,
        assigneeId: data.assigneeId,
        creatorId: req.user.id,
        labels: data.labelIds ? {
          connect: data.labelIds.map((id) => ({ id })),
        } : undefined,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        creator: { select: { id: true, name: true, email: true, avatar: true } },
        labels: { select: { id: true, name: true, color: true } },
        subtasks: true,
      },
    });

    // Create History
    await prisma.taskHistory.create({
      data: {
        taskId: task.id,
        userId: req.user.id,
        field: 'status',
        oldValue: null,
        newValue: 'TODO',
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(data.projectId).emit('task:created', task);

      // Send notification if assignee exists
      if (data.assigneeId) {
        const notification = await prisma.notification.create({
          data: {
            userId: data.assigneeId,
            type: 'TASK_ASSIGNED',
            title: 'Nhiệm vụ được giao',
            message: `Bạn đã được giao nhiệm vụ: "${task.title}"`,
            taskId: task.id,
            projectId: data.projectId,
          },
        });
        io.to(`user:${data.assigneeId}`).emit('notification', notification);
      }
    }

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTaskById(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        creator: { select: { id: true, name: true, email: true, avatar: true } },
        labels: { select: { id: true, name: true, color: true } },
        subtasks: {
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        history: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!task) {
      return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const data = updateTaskSchema.parse(req.body);
    const taskId = req.params.id;

    const oldTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!oldTask) {
      return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
    }

    const updates: any = {};
    const historyPromises = [];

    if (data.title !== undefined && data.title !== oldTask.title) {
      updates.title = data.title;
      historyPromises.push(prisma.taskHistory.create({
        data: { taskId, userId: req.user.id, field: 'title', oldValue: oldTask.title, newValue: data.title },
      }));
    }

    if (data.description !== undefined && data.description !== oldTask.description) {
      updates.description = data.description;
      historyPromises.push(prisma.taskHistory.create({
        data: { taskId, userId: req.user.id, field: 'description', oldValue: oldTask.description, newValue: data.description || '' },
      }));
    }

    if (data.priority !== undefined && data.priority !== oldTask.priority) {
      updates.priority = data.priority;
      historyPromises.push(prisma.taskHistory.create({
        data: { taskId, userId: req.user.id, field: 'priority', oldValue: oldTask.priority, newValue: data.priority },
      }));
    }

    if (data.deadline !== undefined) {
      const newDeadline = data.deadline ? new Date(data.deadline) : null;
      const oldTime = oldTask.deadline ? new Date(oldTask.deadline).getTime() : 0;
      const newTime = newDeadline ? newDeadline.getTime() : 0;

      if (oldTime !== newTime) {
        updates.deadline = newDeadline;
        historyPromises.push(prisma.taskHistory.create({
          data: { taskId, userId: req.user.id, field: 'deadline', oldValue: oldTask.deadline?.toISOString() || null, newValue: newDeadline?.toISOString() || 'None' },
        }));
      }
    }

    if (data.assigneeId !== undefined && data.assigneeId !== oldTask.assigneeId) {
      updates.assigneeId = data.assigneeId;
      historyPromises.push(prisma.taskHistory.create({
        data: { taskId, userId: req.user.id, field: 'assigneeId', oldValue: oldTask.assigneeId, newValue: data.assigneeId || 'None' },
      }));
    }

    if (data.labelIds !== undefined) {
      updates.labels = {
        set: data.labelIds.map((id) => ({ id })),
      };
    }

    if (Object.keys(updates).length === 0) {
      return res.status(200).json({ success: true, data: oldTask });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updates,
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        creator: { select: { id: true, name: true, email: true, avatar: true } },
        labels: { select: { id: true, name: true, color: true } },
        subtasks: true,
      },
    });

    await Promise.all(historyPromises);

    // Socket Emit
    const io = req.app.get('io');
    if (io) {
      io.to(oldTask.projectId).emit('task:updated', { taskId, changes: updates });

      // Notify new assignee if changed
      if (data.assigneeId && data.assigneeId !== oldTask.assigneeId) {
        const notification = await prisma.notification.create({
          data: {
            userId: data.assigneeId,
            type: 'TASK_ASSIGNED',
            title: 'Giao lại nhiệm vụ',
            message: `Bạn đã được giao lại nhiệm vụ: "${updatedTask.title}"`,
            taskId: updatedTask.id,
            projectId: updatedTask.projectId,
          },
        });
        io.to(`user:${data.assigneeId}`).emit('notification', notification);
      }
    }

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    const taskId = req.params.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(task.projectId).emit('task:deleted', { taskId });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const data = updateTaskStatusSchema.parse(req.body);
    const taskId = req.params.id;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
    }

    // Verify permission: LEADER, or Assigned Member
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: req.user.id,
        },
      },
    });

    const isAssignee = task.assigneeId === req.user.id;
    const isLeaderOrAdmin = member?.role === 'LEADER' || req.user.role === 'ADMIN';

    if (!isAssignee && !isLeaderOrAdmin) {
      return next(new AppError(403, 'FORBIDDEN', 'Only the assignee or project leader can change task status'));
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: data.status },
      include: {
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: req.user.id,
        field: 'status',
        oldValue: task.status,
        newValue: data.status,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(task.projectId).emit('task:status-changed', {
        taskId,
        oldStatus: task.status,
        newStatus: data.status,
        userId: req.user.id,
      });

      // Send notification to task creator if updated by assignee
      if (isAssignee && task.creatorId !== req.user.id) {
        const statusText = data.status === 'TODO' ? 'Cần làm' : data.status === 'IN_PROGRESS' ? 'Đang thực hiện' : data.status === 'REVIEW' ? 'Chờ đánh giá' : 'Hoàn thành';
        const roleText = req.user.role === 'ADMIN' ? 'Quản trị viên' : req.user.role === 'LEADER' ? 'Trưởng nhóm' : 'Thành viên';
        const notification = await prisma.notification.create({
          data: {
            userId: task.creatorId,
            type: 'TASK_UPDATED',
            title: 'Cập nhật trạng thái công việc',
            message: `Nhiệm vụ "${updatedTask.title}" đã được chuyển sang trạng thái "${statusText}" bởi ${roleText}`,
            taskId,
            projectId: task.projectId,
          },
        });
        io.to(`user:${task.creatorId}`).emit('notification', notification);
      }
    }

    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    next(error);
  }
}

export async function reorderTasks(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));

    const data = reorderTasksSchema.parse(req.body);
    const { taskId, newOrder, status } = data;

    const taskToMove = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!taskToMove) {
      return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
    }

    const projectId = taskToMove.projectId;
    const oldStatus = taskToMove.status;

    // Check permissions if changing columns (status change)
    if (oldStatus !== status) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { ownerId: true },
      });

      if (!project) {
        return next(new AppError(404, 'NOT_FOUND', 'Project not found'));
      }

      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId,
            userId: req.user.id,
          },
        },
      });

      const isLeaderOrAdmin = member?.role === 'LEADER' || req.user.role === 'ADMIN' || project.ownerId === req.user.id;
      const isAssignee = taskToMove.assigneeId === req.user.id;

      if (!isAssignee && !isLeaderOrAdmin) {
        return next(new AppError(403, 'FORBIDDEN', 'Only the assignee or project leader can change task status'));
      }
    }

    // Transaction for reordering
    await prisma.$transaction(async (tx) => {
      if (oldStatus === status) {
        // 1. Moving within same column
        const tasks = await tx.task.findMany({
          where: { projectId, status },
          orderBy: { order: 'asc' },
        });

        const filteredTasks = tasks.filter((t) => t.id !== taskId);
        filteredTasks.splice(newOrder, 0, taskToMove);

        // Update database orders
        for (let i = 0; i < filteredTasks.length; i++) {
          await tx.task.update({
            where: { id: filteredTasks[i].id },
            data: { order: i },
          });
        }
      } else {
        // 2. Moving to different column
        // Decrease order of old status tasks that were after taskToMove
        await tx.task.updateMany({
          where: {
            projectId,
            status: oldStatus,
            order: { gt: taskToMove.order },
          },
          data: {
            order: { decrement: 1 },
          },
        });

        // Increase order of new status tasks that are at/after newOrder
        await tx.task.updateMany({
          where: {
            projectId,
            status,
            order: { gte: newOrder },
          },
          data: {
            order: { increment: 1 },
          },
        });

        // Update moved task
        await tx.task.update({
          where: { id: taskId },
          data: { status, order: newOrder },
        });

        // Log History
        await tx.taskHistory.create({
          data: {
            taskId,
            userId: req.user!.id,
            field: 'status',
            oldValue: oldStatus,
            newValue: status,
          },
        });
      }
    });

    // Socket Emit
    const io = req.app.get('io');
    if (io) {
      io.to(projectId).emit('task:reordered', { taskId, newOrder, status });
    }

    res.status(200).json({
      success: true,
      message: 'Tasks reordered successfully',
    });
  } catch (error) {
    next(error);
  }
}
