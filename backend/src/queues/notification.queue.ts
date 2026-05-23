import { Queue } from 'bullmq';
import redis from '../config/redis';
import prisma from '../config/database';
import { sendEmail, sendWelcomeEmail, sendApplicationConfirmationEmail, sendMentorAssignmentEmails, sendPerformanceScoreEmail } from '../utils/email';
import { logger } from '../utils/logger';
import { getSocketIO } from '../socket/socket';

// Define the queue name constant
export const NOTIFICATION_QUEUE_NAME = 'notification-queue';

// Create the BullMQ queue using our shared Redis instance
export const notificationQueue = new Queue(NOTIFICATION_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5 seconds before retrying
    },
    removeOnComplete: true, // Auto-clean finished jobs
    removeOnFail: false, // Keep failed jobs for debugging
  },
});

export const processNotificationJobDirectly = async (name: string, data: any) => {
  logger.info(`Processing job ${name} directly (Fallback)`);
  try {
    const io = getSocketIO();
    switch (name) {
      case 'send_direct_notification': {
        const { userId, title, message, type, data: extraData, triggerEmail, emailSubject } = data;
        const notification = await prisma.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            data: extraData || undefined,
          },
        });
        if (io) {
          io.to(`user:${userId}`).emit('notification', notification);
        }
        if (triggerEmail) {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
          });
          if (user?.email) {
            const emailHtml = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                <h2 style="color: #4f46e5; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">${title}</h2>
                <p style="font-size: 16px; line-height: 1.5; color: #334155;">${message}</p>
                <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 6px; font-size: 12px; color: #64748b;">
                  This is an automated notification from the Intern Management System.
                </div>
              </div>
            `;
            await sendEmail(user.email, emailSubject || title, emailHtml);
          }
        }
        break;
      }
      case 'send_bulk_notification': {
        const { userIds, title, message, type, data: extraData } = data;
        if (!Array.isArray(userIds) || userIds.length === 0) return;
        const notifications = await prisma.$transaction(
          userIds.map((userId: string) =>
            prisma.notification.create({
              data: {
                userId,
                title,
                message,
                type,
                data: extraData || undefined,
              },
            })
          )
        );
        if (io) {
          notifications.forEach((notif) => {
            io.to(`user:${notif.userId}`).emit('notification', notif);
          });
        }
        break;
      }
      case 'send_email': {
        const { to, subject, html } = data;
        await sendEmail(to, subject, html);
        break;
      }
      case 'send_welcome_email': {
        const { email, name, role, resetToken } = data;
        await sendWelcomeEmail(email, name, role, resetToken);
        break;
      }
      case 'send_application_confirmation': {
        const { email, name, departmentName } = data;
        await sendApplicationConfirmationEmail(email, name, departmentName);
        break;
      }
      case 'send_mentor_assignment': {
        const { internEmail, internName, mentorEmail, mentorName } = data;
        await sendMentorAssignmentEmails(internEmail, internName, mentorEmail, mentorName);
        break;
      }
      case 'send_score_update': {
        const { email, name, score } = data;
        await sendPerformanceScoreEmail(email, name, score);
        break;
      }
      default:
        logger.warn(`Unknown direct job name: ${name}`);
    }
  } catch (error) {
    logger.error(`Error in direct fallback job processing for ${name}:`, error);
  }
};

/**
 * Safely adds a job to the BullMQ queue.
 * If Redis is offline/connecting/down, it automatically falls back to non-blocking direct processing.
 */
export const safeAddJob = async (name: string, data: any) => {
  // If Redis is connected, use the queue
  if (redis.status === 'ready') {
    try {
      const job = await notificationQueue.add(name, data);
      logger.info(`Successfully added background job ${job.id} (Name: ${name}) to queue`);
      return job;
    } catch (err) {
      logger.warn(`Failed to add job ${name} to queue, falling back to direct execution:`, err);
      // Fallback
      setTimeout(() => processNotificationJobDirectly(name, data), 0);
      return null;
    }
  } else {
    logger.info(`Redis is offline (status: ${redis.status}). Processing job ${name} directly in background...`);
    // Non-blocking direct execution fallback
    setTimeout(() => processNotificationJobDirectly(name, data), 0);
    return null;
  }
};
