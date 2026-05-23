import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import { successResponse } from '../utils/response';

export class NotificationController {
  /**
   * Fetch paginated notification history for the authenticated user
   */
  async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { isRead, page, limit } = req.query as any;

      const result = await notificationService.getNotifications(
        userId,
        isRead,
        page ? parseInt(page as string, 10) : 1,
        limit ? parseInt(limit as string, 10) : 20
      );

      res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const id = req.params.id as string;
      const notification = await notificationService.markAsRead(id, userId);

      successResponse(res, 'Notification marked as read successfully', notification);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all unread notifications for the user as read
   */
  async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await notificationService.markAllAsRead(userId);

      successResponse(res, 'All notifications marked as read successfully', {
        modifiedCount: result.count,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();
