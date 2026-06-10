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

  // 2. Monday 9:00 AM - Weekly AI Performance & Overview Digests to all users
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Running scheduled weekly performance AI digests job...');
    try {
      const { default: weeklyDigestService } = await import('../services/weeklyDigest.service');
      await weeklyDigestService.sendDigestToAllUsers();
    } catch (error) {
      logger.error('Error in scheduled weekly performance AI digests job:', error);
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

  // 6. Weekdays 9:00 AM - Daily Standup Bot Prompt & Record Initialization
  cron.schedule('0 9 * * 1-5', async () => {
    logger.info('Initializing weekday standup records...');
    try {
      const { createDailyRecords } = await import('../services/standup.service');
      await createDailyRecords();
    } catch (error) {
      logger.error('Error in daily standup initialization job:', error);
    }
  });

  // 7. Weekdays 11:30 AM - Daily Standup Overdue check & alert
  cron.schedule('30 11 * * 1-5', async () => {
    logger.info('Checking overdue daily standups...');
    try {
      const { checkMissedStandups } = await import('../services/standup.service');
      await checkMissedStandups();
    } catch (error) {
      logger.error('Error in daily standup overdue check job:', error);
    }
  });

  // 8. Sunday 8:00 PM - Auto-evaluate weekly goals whose end date has passed
  cron.schedule('0 20 * * 0', async () => {
    logger.info('Running scheduled weekly goal evaluation...');
    try {
      const { default: goalService } = await import('../services/goal.service');
      await goalService.evaluateWeeklyGoals();
    } catch (error) {
      logger.error('Error in scheduled weekly goal evaluation:', error);
    }
  });

  // 9. Sunday 9:00 PM - Weekly Skill Gap check
  cron.schedule('0 21 * * 0', async () => {
    logger.info('Running weekly skill gap analysis check...');
    try {
      const { default: skillGapService } = await import('../services/skillGap.service');
      await skillGapService.runWeeklyAnalysisForAllInterns();
    } catch (error) {
      logger.error('Error in weekly skill gap analysis job:', error);
    }
  });

  // 10. Sunday 10:00 PM - Weekly Mentor Effectiveness snapshot
  cron.schedule('0 22 * * 0', async () => {
    logger.info('Running weekly mentor effectiveness scoring check...');
    try {
      const { default: mentorEffectivenessService } = await import('../services/mentorEffectiveness.service');
      await mentorEffectivenessService.runWeeklyCalculationsForAllMentors();
    } catch (error) {
      logger.error('Error in weekly mentor effectiveness scoring job:', error);
    }
  });
};
