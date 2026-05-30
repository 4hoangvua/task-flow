import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../utils/errors';
import { createTaskSchema, updateTaskSchema, updateTaskStatusSchema, reorderTasksSchema, addDependencySchema } from '../utils/validation';

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : '';
    if (!projectId) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Project ID is required'));
    }

    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const assigneeId = typeof req.query.assigneeId === 'string' ? req.query.assigneeId : undefined;
    const priority = typeof req.query.priority === 'string' ? req.query.priority : undefined;
    const page = typeof req.query.page === 'string' ? parseInt(req.query.page) || 1 : 1;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit) || 50 : 50;
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
          dependencies: {
            include: {
              dependsOn: {
                select: { id: true, title: true, status: true }
              }
            }
          },
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
        startDate: data.startDate ? new Date(data.startDate) : null,
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
          orderBy: { createdAt: 'asc' },
        },
        history: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        dependencies: {
          include: {
            dependsOn: {
              select: {
                id: true,
                title: true,
                status: true,
                assignee: { select: { id: true, name: true, email: true, avatar: true } }
              }
            }
          }
        },
        dependents: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                assignee: { select: { id: true, name: true, email: true, avatar: true } }
              }
            }
          }
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

    // Validate startDate vs deadline relation with old task data
    const finalStartDate = data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : oldTask.startDate;
    const finalDeadline = data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : oldTask.deadline;

    if (finalStartDate && finalDeadline && finalStartDate.getTime() > finalDeadline.getTime()) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Ngày bắt đầu không thể sau hạn chót'));
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

    if (data.startDate !== undefined) {
      const newStartDate = data.startDate ? new Date(data.startDate) : null;
      const oldTime = oldTask.startDate ? new Date(oldTask.startDate).getTime() : 0;
      const newTime = newStartDate ? newStartDate.getTime() : 0;

      if (oldTime !== newTime) {
        updates.startDate = newStartDate;
        historyPromises.push(prisma.taskHistory.create({
          data: { taskId, userId: req.user.id, field: 'startDate', oldValue: oldTask.startDate?.toISOString() || null, newValue: newStartDate?.toISOString() || 'None' },
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

    // Delete task and shift down orders of subsequent tasks in the same column
    await prisma.$transaction([
      prisma.task.delete({
        where: { id: taskId },
      }),
      prisma.task.updateMany({
        where: {
          projectId: task.projectId,
          status: task.status,
          order: { gt: task.order },
        },
        data: {
          order: { decrement: 1 },
        },
      }),
    ]);

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

    // Verify permission: LEADER, or Assigned Member, or Project Owner
    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      select: { ownerId: true },
    });

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: req.user.id,
        },
      },
    });

    const isAssignee = task.assigneeId === req.user.id;
    const isLeaderOrAdmin = member?.role === 'LEADER' || req.user.role === 'ADMIN' || project?.ownerId === req.user.id;

    if (!isAssignee && !isLeaderOrAdmin) {
      return next(new AppError(403, 'FORBIDDEN', 'Only the assignee or project leader can change task status'));
    }

    if (data.status === 'DONE') {
      const incompleteDependencies = await prisma.taskDependency.findMany({
        where: {
          taskId,
          dependsOn: {
            status: { not: 'DONE' },
          },
        },
        include: {
          dependsOn: {
            select: { title: true },
          },
        },
      });

      if (incompleteDependencies.length > 0) {
        const titles = incompleteDependencies.map((d) => `"${d.dependsOn.title}"`).join(', ');
        return next(new AppError(400, 'VALIDATION_ERROR', `Không thể hoàn thành công việc vì các công việc tiên quyết chưa hoàn thành: ${titles}`));
      }
    }

    const oldStatus = task.status;
    const newStatus = data.status;
    let updatedTask;

    if (oldStatus !== newStatus) {
      // Count tasks in target column to set new order at the end
      const newStatusCount = await prisma.task.count({
        where: {
          projectId: task.projectId,
          status: newStatus,
        },
      });

      const result = await prisma.$transaction([
        // Decrease order of tasks in old status column that were after the moved task
        prisma.task.updateMany({
          where: {
            projectId: task.projectId,
            status: oldStatus,
            order: { gt: task.order },
          },
          data: {
            order: { decrement: 1 },
          },
        }),
        // Update moved task's status and its new order index
        prisma.task.update({
          where: { id: taskId },
          data: {
            status: newStatus,
            order: newStatusCount,
          },
          include: {
            assignee: { select: { id: true, name: true, email: true, avatar: true } },
          },
        }),
      ]);
      updatedTask = result[1];
    } else {
      updatedTask = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: { select: { id: true, name: true, email: true, avatar: true } },
        },
      });
    }

    if (!updatedTask) {
      return next(new AppError(404, 'NOT_FOUND', 'Task not found'));
    }

    if (oldStatus !== newStatus) {
      await prisma.taskHistory.create({
        data: {
          taskId,
          userId: req.user.id,
          field: 'status',
          oldValue: oldStatus,
          newValue: newStatus,
        },
      });
    }

    const io = req.app.get('io');
    if (io && oldStatus !== newStatus) {
      io.to(task.projectId).emit('task:status-changed', {
        taskId,
        oldStatus,
        newStatus,
        userId: req.user.id,
      });

      // Send notification to task creator if updated by assignee
      if (isAssignee && task.creatorId !== req.user.id) {
        const statusText = newStatus === 'TODO' ? 'Cần làm' : newStatus === 'IN_PROGRESS' ? 'Đang thực hiện' : newStatus === 'REVIEW' ? 'Chờ đánh giá' : 'Hoàn thành';
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

      if (status === 'DONE') {
        const incompleteDependencies = await prisma.taskDependency.findMany({
          where: {
            taskId,
            dependsOn: {
              status: { not: 'DONE' },
            },
          },
          include: {
            dependsOn: {
              select: { title: true },
            },
          },
        });

        if (incompleteDependencies.length > 0) {
          const titles = incompleteDependencies.map((d) => `"${d.dependsOn.title}"`).join(', ');
          return next(new AppError(400, 'VALIDATION_ERROR', `Không thể hoàn thành công việc vì các công việc tiên quyết chưa hoàn thành: ${titles}`));
        }
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

async function hasCircularPath(currentId: string, targetId: string, visited = new Set<string>()): Promise<boolean> {
  if (currentId === targetId) return true;
  visited.add(currentId);

  const dependencies = await prisma.taskDependency.findMany({
    where: { taskId: currentId },
    select: { dependsOnId: true },
  });

  for (const dep of dependencies) {
    if (!visited.has(dep.dependsOnId)) {
      const found = await hasCircularPath(dep.dependsOnId, targetId, visited);
      if (found) return true;
    }
  }

  return false;
}

export async function addDependency(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    const taskId = req.params.id;
    const { dependsOnId } = addDependencySchema.parse(req.body);

    if (taskId === dependsOnId) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Một công việc không thể phụ thuộc vào chính nó'));
    }

    const [task, prerequisite] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskId } }),
      prisma.task.findUnique({ where: { id: dependsOnId } }),
    ]);

    if (!task || !prerequisite) {
      return next(new AppError(404, 'NOT_FOUND', 'Không tìm thấy công việc'));
    }

    if (task.projectId !== prerequisite.projectId) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Các công việc phải thuộc cùng một dự án'));
    }

    // Check circular dependency (direct or indirect)
    const isCircular = await hasCircularPath(dependsOnId, taskId);

    if (isCircular) {
      return next(new AppError(400, 'VALIDATION_ERROR', `Liên kết phụ thuộc tuần hoàn: công việc "${prerequisite.title}" đã phụ thuộc vào "${task.title}"`));
    }

    // Check if duplicate dependency
    const existing = await prisma.taskDependency.findFirst({
      where: {
        taskId,
        dependsOnId,
      },
    });

    if (existing) {
      return res.status(200).json({ success: true, message: 'Liên kết phụ thuộc đã tồn tại' });
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnId,
      },
      include: {
        dependsOn: {
          select: {
            id: true,
            title: true,
            status: true,
            assignee: { select: { id: true, name: true, email: true, avatar: true } }
          },
        },
      },
    });

    // Create history
    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: req.user.id,
        field: 'dependency',
        oldValue: null,
        newValue: `Đã thêm phụ thuộc vào: ${prerequisite.title}`,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(task.projectId).emit('task:updated', { taskId, changes: { dependencyAdded: dependency } });
    }

    res.status(201).json({
      success: true,
      data: dependency,
    });
  } catch (error) {
    next(error);
  }
}

export async function removeDependency(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(new AppError(401, 'AUTH_INVALID', 'Unauthorized'));
    const taskId = req.params.id;
    const dependsOnId = req.params.dependsOnId;

    const dependency = await prisma.taskDependency.findUnique({
      where: {
        taskId_dependsOnId: {
          taskId,
          dependsOnId,
        },
      },
      include: {
        dependsOn: { select: { title: true } },
        task: { select: { projectId: true } },
      },
    });

    if (!dependency) {
      return next(new AppError(404, 'NOT_FOUND', 'Không tìm thấy liên kết phụ thuộc'));
    }

    await prisma.taskDependency.delete({
      where: {
        taskId_dependsOnId: {
          taskId,
          dependsOnId,
        },
      },
    });

    // Create history
    await prisma.taskHistory.create({
      data: {
        taskId,
        userId: req.user.id,
        field: 'dependency',
        oldValue: `Đã gỡ phụ thuộc: ${dependency.dependsOn.title}`,
        newValue: 'None',
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(dependency.task.projectId).emit('task:updated', { taskId, changes: { dependencyRemovedId: dependsOnId } });
    }

    res.status(200).json({
      success: true,
      message: 'Đã gỡ bỏ công việc phụ thuộc',
    });
  } catch (error) {
    next(error);
  }
}
