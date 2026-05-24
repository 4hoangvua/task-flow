import { prisma } from '../lib/prisma';
import { logger } from './logger';
import { Server } from 'socket.io';

export function startDeadlineScheduler(io: Server) {
  // Check every hour (3600000 ms)
  const CHECK_INTERVAL = 60 * 60 * 1000;

  const checkDeadlines = async () => {
    try {
      logger.info('[Scheduler] Running deadline approaching check...');
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find all tasks that are:
      // 1. Not DONE
      // 2. Have an assignee
      // 3. Deadline is between now and the next 24 hours
      const tasks = await prisma.task.findMany({
        where: {
          status: { not: 'DONE' },
          assigneeId: { not: null },
          deadline: {
            gt: now,
            lte: next24Hours,
          },
        },
        include: {
          assignee: { select: { id: true, email: true, name: true } },
        },
      });

      logger.info(`[Scheduler] Found ${tasks.length} tasks with deadlines within the next 24 hours.`);

      for (const task of tasks) {
        if (!task.assigneeId) continue;

        // Check if we have already sent a DEADLINE_APPROACHING notification for this task
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: task.assigneeId,
            taskId: task.id,
            type: 'DEADLINE_APPROACHING',
          },
        });

        if (!existingNotification) {
          logger.info(`[Scheduler] Creating deadline approaching notification for task: "${task.title}" (assignee: ${task.assignee?.email})`);
          
          const timeRemaining = Math.max(0, Math.round((new Date(task.deadline!).getTime() - now.getTime()) / (60 * 1000))); // in minutes
          const hours = Math.floor(timeRemaining / 60);
          const minutes = timeRemaining % 60;
          const timeStr = hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;

          const notification = await prisma.notification.create({
            data: {
              userId: task.assigneeId,
              type: 'DEADLINE_APPROACHING',
              title: 'Hạn chót công việc sắp tới!',
              message: `Công việc "${task.title}" của bạn sẽ hết hạn trong ${timeStr} nữa (Hạn chót: ${new Date(task.deadline!).toLocaleTimeString('vi-VN')} ngày ${new Date(task.deadline!).toLocaleDateString('vi-VN')}).`,
              taskId: task.id,
              projectId: task.projectId,
            },
          });

          // Push real-time notification via Socket.io to the specific user room
          io.to(`user:${task.assigneeId}`).emit('notification', notification);
        }
      }
    } catch (error) {
      logger.error('[Scheduler] Error running deadline scheduler check:', error);
    }
  };

  // Run initial check on startup
  checkDeadlines();

  // Set interval to check periodically
  const intervalId = setInterval(checkDeadlines, CHECK_INTERVAL);
  return intervalId;
}
