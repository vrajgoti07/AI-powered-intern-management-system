import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { getNotificationsQuerySchema } from '../validations/notification.validation';

const router = Router();

// Protect all routes with JWT authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get paginated notification history for the authenticated user
 * @access  Authenticated Users
 */
router.get('/', validate(getNotificationsQuerySchema), notificationController.getNotifications);

/**
 * @route   PUT /api/v1/notifications/:id/read
 * @desc    Mark a specific notification as read
 * @access  Authenticated Users
 */
router.put('/:id/read', notificationController.markAsRead);
router.patch('/:id/read', notificationController.markAsRead);

/**
 * @route   PUT /api/v1/notifications/read-all
 * @desc    Mark all unread notifications for the user as read
 * @access  Authenticated Users
 */
router.put('/read-all', notificationController.markAllAsRead);

export default router;
