import { Worker, Job } from 'bullmq';
import redis from '../config/redis';
import { NOTIFICATION_QUEUE_NAME } from './notification.queue';
import prisma from '../config/database';
import { sendEmail, sendWelcomeEmail, sendApplicationConfirmationEmail, sendMentorAssignmentEmails, sendPerformanceScoreEmail } from '../utils/email';
import { logger } from '../utils/logger';
import { getSocketIO } from '../socket/socket';
import { getSimpleSocketIO } from '../socket/index';

// Initialize the worker to process notification jobs
export const notificationWorker = new Worker(
  NOTIFICATION_QUEUE_NAME,
  async (job: Job) => {
    logger.info(`Processing background notification job: ${job.name} (ID: ${job.id})`);

    try {
      const io = getSocketIO();

      switch (job.name) {
        case 'send_direct_notification': {
          const { userId, title, message, type, data, triggerEmail, emailSubject } = job.data;

          // 1. Persist notification in database
          const notification = await prisma.notification.create({
            data: {
              userId,
              title,
              message,
              type,
              data: data || undefined,
            },
          });

          // 2. Dispatch real-time WebSocket alert if the user is connected
          if (io) {
            io.to(`user:${userId}`).emit('notification', notification);
            io.to(`user:${userId}`).emit('new-notification', notification);
            logger.info(`Dispatched real-time socket notification to user:${userId}`);
          }

          const simpleIo = getSimpleSocketIO();
          if (simpleIo) {
            simpleIo.emit('new-notification', notification);
            logger.info(`Dispatched simple socket notification to all connected clients`);
          }

          // 3. Trigger SMTP Email in the background if requested
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
          const { userIds, title, message, type, data } = job.data;

          if (!Array.isArray(userIds) || userIds.length === 0) {
            logger.warn('Skipping bulk notification: Empty userIds array');
            return;
          }

          logger.info(`Sending bulk notification to ${userIds.length} users`);

          // 1. Transactionally insert all notifications in bulk
          const notifications = await prisma.$transaction(
            userIds.map((userId: string) =>
              prisma.notification.create({
                data: {
                  userId,
                  title,
                  message,
                  type,
                  data: data || undefined,
                },
              })
            )
          );

          // 2. Dispatch WebSocket alerts to all active users
          if (io) {
            notifications.forEach((notif) => {
              io.to(`user:${notif.userId}`).emit('notification', notif);
              io.to(`user:${notif.userId}`).emit('new-notification', notif);
            });
            logger.info(`Dispatched bulk socket notifications to ${notifications.length} users`);
          }

          const simpleIo = getSimpleSocketIO();
          if (simpleIo) {
            notifications.forEach((notif) => {
              simpleIo.emit('new-notification', notif);
            });
            logger.info(`Dispatched bulk simple socket notifications to all connected clients`);
          }
          break;
        }

        case 'send_email': {
          const { to, subject, html } = job.data;
          await sendEmail(to, subject, html);
          break;
        }

        case 'send_welcome_email': {
          const { email, name, role, resetToken } = job.data;
          await sendWelcomeEmail(email, name, role, resetToken);
          break;
        }

        case 'send_application_confirmation': {
          const { email, name, departmentName } = job.data;
          await sendApplicationConfirmationEmail(email, name, departmentName);
          break;
        }

        case 'send_mentor_assignment': {
          const { internEmail, internName, mentorEmail, mentorName } = job.data;
          await sendMentorAssignmentEmails(internEmail, internName, mentorEmail, mentorName);
          break;
        }

        case 'send_score_update': {
          const { email, name, score } = job.data;
          await sendPerformanceScoreEmail(email, name, score);
          break;
        }

        default:
          logger.warn(`Unknown job name encountered in notification worker: ${job.name}`);
      }
    } catch (error) {
      logger.error(`Error processing job ${job.id} (Name: ${job.name}):`, error);
      throw error; // Let BullMQ capture the failure and trigger backoff/retry
    }
  },
  {
    connection: redis.duplicate() as any,
  }
);

// Worker events hookups
notificationWorker.on('completed', (job: Job) => {
  logger.info(`Background job ${job.id} completed successfully`);
});

notificationWorker.on('failed', (job: Job | undefined, err: Error) => {
  logger.error(`Background job ${job?.id} failed with error:`, err);
});
