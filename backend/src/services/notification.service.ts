import prisma from '../config/database';
import { safeAddJob } from '../queues/notification.queue';
import { logger } from '../utils/logger';

export class NotificationService {
  /**
   * Create a single user notification (queued via BullMQ)
   */
  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    data?: any,
    triggerEmail: boolean = false,
    emailSubject?: string
  ) {
    try {
      // Add job to BullMQ queue to process email and socket logic asynchronously
      const job = await safeAddJob('send_direct_notification', {
        userId,
        title,
        message,
        type,
        data,
        triggerEmail,
        emailSubject,
      });

      logger.info(`Queued single notification job for user ${userId}`);
      return job;
    } catch (error) {
      logger.error(`Failed to queue notification for user ${userId}, falling back to DB write:`, error);
      
      // Fallback: directly persist in database to ensure notification delivery
      return prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          data: data || undefined,
        },
      });
    }
  }

  /**
   * Create bulk user notifications (queued via BullMQ)
   */
  async sendBulkNotifications(
    userIds: string[],
    title: string,
    message: string,
    type: string,
    data?: any
  ) {
    try {
      const job = await safeAddJob('send_bulk_notification', {
        userIds,
        title,
        message,
        type,
        data,
      });

      logger.info(`Queued bulk notification job for ${userIds.length} users`);
      return job;
    } catch (error) {
      logger.error('Failed to queue bulk notification, falling back to DB writes:', error);
      
      // Fallback: transactionally write all notifications directly to the database
      return prisma.$transaction(
        userIds.map((userId) =>
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
    }
  }

  /**
   * Get paginated notifications history for a user
   */
  async getNotifications(userId: string, isRead?: boolean, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const whereClause: any = { userId };
    if (isRead !== undefined) {
      whereClause.isRead = isRead;
    }

    const [notifications, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: whereClause }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    // Assert notification ownership before updating
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.userId !== userId) {
      throw new Error('Notification not found or unauthorized');
    }

    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * Broadcast a notification to all active HR users
   */
  async notifyHR(
    title: string,
    message: string,
    type: string,
    data?: any
  ) {
    try {
      const hrUsers = await prisma.user.findMany({
        where: {
          role: 'HR',
          isActive: true,
        },
        select: { id: true },
      });

      if (hrUsers.length === 0) {
        logger.info('No active HR users found to notify.');
        return;
      }

      const userIds = hrUsers.map((hr) => hr.id);
      await this.sendBulkNotifications(userIds, title, message, type, data);
      logger.info(`Broadcasted notification "${title}" to ${hrUsers.length} HR users.`);
    } catch (error) {
      logger.error('Failed to notify HR users:', error);
    }
  }
}

export default new NotificationService();
