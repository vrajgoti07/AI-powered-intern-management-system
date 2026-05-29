import cron from 'node-cron';
import prisma from '../config/database';
import { emailQueue } from '../queues/queue.config';
import { logger } from '../utils/logger';

export const startScheduledJobs = () => {
  logger.info('Initializing Scheduled Jobs...');

  // 1. Daily 9:00 AM - Deadline reminder check (tasks due in 2 days)
  cron.schedule('0 9 * * *', async () => {
    logger.info('Running daily deadline reminder check...');
    try {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 2);
      
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

      const tasks = await prisma.task.findMany({
        where: {
          dueDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: {
            notIn: ['COMPLETED', 'REVIEW']
          }
        },
        include: {
          intern: {
            include: { user: true }
          }
        }
      });

      for (const task of tasks) {
        if (task.intern.user.email) {
          await emailQueue.add('DEADLINE_REMINDER', {
            to: task.intern.user.email,
            data: {
              name: task.intern.user.name,
              taskTitle: task.title,
              dueDate: task.dueDate.toISOString().split('T')[0],
              daysLeft: 2,
              taskUrl: `${process.env.FRONTEND_URL}/tasks/${task.id}`
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error in daily deadline reminder check:', error);
    }
  });

  // 2. Monday 8:00 AM - Weekly summary emails to all interns
  cron.schedule('0 8 * * 1', async () => {
    logger.info('Running weekly summary emails...');
    try {
      const interns = await prisma.intern.findMany({
        where: { status: 'ACTIVE' },
        include: { user: true }
      });

      // Get last week's start and end date
      const endOfLastWeek = new Date();
      endOfLastWeek.setDate(endOfLastWeek.getDate() - endOfLastWeek.getDay());
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(startOfLastWeek.getDate() - 6);

      for (const intern of interns) {
        if (intern.user.email) {
          const completedTasksCount = await prisma.task.count({
            where: {
              internId: intern.id,
              status: 'COMPLETED',
              updatedAt: { gte: startOfLastWeek, lte: endOfLastWeek }
            }
          });
          
          const attendanceDays = await prisma.attendance.count({
            where: {
              internId: intern.id,
              status: 'PRESENT',
              date: { gte: startOfLastWeek, lte: endOfLastWeek }
            }
          });

          await emailQueue.add('WEEKLY_SUMMARY', {
            to: intern.user.email,
            data: {
              name: intern.user.name,
              weekNumber: Math.ceil((new Date().getTime() - new Date(intern.startDate || intern.joinedDate).getTime()) / (1000 * 60 * 60 * 24 * 7)),
              tasksCompleted: completedTasksCount,
              attendanceDays: attendanceDays,
              performanceScore: intern.score,
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error in weekly summary job:', error);
    }
  });

  // 3. Daily 11:59 PM - Mark absent for interns who didn't check in today
  cron.schedule('59 23 * * *', async () => {
    logger.info('Running daily auto-absent mark job...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeInterns = await prisma.intern.findMany({
        where: { status: 'ACTIVE' }
      });

      for (const intern of activeInterns) {
        const attendance = await prisma.attendance.findUnique({
          where: {
            internId_date: {
              internId: intern.id,
              date: today,
            }
          }
        });

        if (!attendance) {
          await prisma.attendance.create({
            data: {
              internId: intern.id,
              date: today,
              status: 'ABSENT',
              notes: 'Auto-marked absent by system'
            }
          });
        }
      }
    } catch (error) {
      logger.error('Error in auto-absent mark job:', error);
    }
  });

  // 4. 1st of every month - Generate monthly attendance report per department
  cron.schedule('0 0 1 * *', async () => {
    logger.info('Generating monthly attendance report (stub)...');
    // Actual implementation would query and send to HR/HOD
  });

  // 5. Sunday 11:00 PM - Clean old notifications
  cron.schedule('0 23 * * 0', async () => {
    logger.info('Cleaning old notifications...');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });
      logger.info(`Deleted ${result.count} old notifications.`);
    } catch (error) {
      logger.error('Error in cleaning old notifications:', error);
    }
  });
};
