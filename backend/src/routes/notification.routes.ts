import { Router } from 'express';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { getNotificationsQuerySchema } from '../validations/notification.validation';
import prisma from '../config/database';
import { safeAddJob } from '../queues/notification.queue';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/notifications/intern-applied  (public — no auth required, called from apply page)
router.post('/intern-applied', async (req: any, res: any) => {
  try {
    const { internName, internEmail, position, college, startDate } = req.body;
    if (!internName) {
      return res.status(400).json({ success: false, message: 'internName is required.' });
    }
    
    // 1. Notify all HR users about the new application inside the web app
    const hrUsers = await prisma.user.findMany({
      where: { role: 'HR', isActive: true },
      select: { id: true, email: true },
    });

    if (hrUsers.length > 0) {
      await prisma.notification.createMany({
        data: hrUsers.map((hr) => ({
          userId: hr.id,
          title: 'New Intern Application',
          message: `${internName} has applied for ${position || 'an internship position'}.`,
          type: 'SYSTEM',
          isRead: false,
        })),
      });
    }

    // 2. Build detailed premium HTML email content for HR
    const emailHtml = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        <div style="text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 25px; margin-bottom: 25px;">
          <div style="font-size: 24px; font-weight: 800; color: #4f46e5; letter-spacing: -0.03em;">InternFlow<span style="color: #6366f1;">•</span></div>
          <h2 style="color: #0f172a; margin: 15px 0 0 0; font-size: 20px; font-weight: 800; tracking-tight: -0.02em;">New Internship Application</h2>
          <p style="color: #64748b; margin: 5px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Recruitment Alert Notification</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 15px 0; font-weight: 600;">Dear HR Team,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
            A new applicant has submitted a secure registration for the internship program. The candidate profile details are listed below:
          </p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; font-weight: 700; color: #64748b; width: 140px; border-bottom: 1px solid #f1f5f9;">Candidate Name</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${internName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Email Address</td>
                <td style="padding: 8px 0; color: #4f46e5; font-weight: 700; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${internEmail || ''}" style="color: #4f46e5; text-decoration: none;">${internEmail || 'Not Provided'}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Preference Track</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${position || 'Engineering'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">University/College</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${college || 'Not Provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Earliest Start Date</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9;">${startDate ? new Date(startDate).toLocaleDateString() : 'Immediate'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 700; color: #64748b;">Alert Timestamp</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="${process.env.FRONTEND_URL || 'https://ai-powered-intern-management-system.vercel.app'}/login" 
             style="display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);">
            Access HR Evaluation Portal
          </a>
        </div>
        
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; font-size: 11px; color: #94a3b8; text-align: center; font-weight: 500; line-height: 1.5;">
          This is a secure automated recruitment transmission from the InternFlow cloud gateway.<br>
          Please do not reply directly to this mail.
        </div>
      </div>
    `;

    // 3. Queue emails to all active HR users
    if (hrUsers.length > 0) {
      for (const hr of hrUsers) {
        if (hr.email) {
          await safeAddJob('send_email', {
            to: hr.email,
            subject: `New Application Received: ${internName} (${position || 'Engineering'})`,
            html: emailHtml,
          });
        }
      }
      logger.info(`Queued new application email alert to ${hrUsers.length} active HR users.`);
    } else {
      // Fallback: Queue email to the default admin/SMTP email if no HR user exists in database
      const fallbackEmail = process.env.SMTP_USER || process.env.EMAIL_FROM;
      if (fallbackEmail) {
        await safeAddJob('send_email', {
          to: fallbackEmail,
          subject: `[Fallback Notification] New Application: ${internName} (${position || 'Engineering'})`,
          html: emailHtml,
        });
        logger.info(`Queued fallback application email alert to ${fallbackEmail}`);
      }
    }

    return res.json({ success: true, message: 'HR team notified and alert emails queued.' });
  } catch (error: any) {
    logger.error('Error in intern-applied route:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// Protect all routes with JWT authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/notifications
 * @desc    Get paginated notification history for the authenticated user
 * @access  Authenticated Users
 */
router.get('/', validate(getNotificationsQuerySchema), notificationController.getNotifications);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Authenticated Users
 */
router.get('/unread-count', notificationController.getUnreadCount);

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

/**
 * @route   DELETE /api/v1/notifications/:id
 * @desc    Delete a notification
 * @access  Authenticated Users
 */
router.delete('/:id', notificationController.deleteNotification);

export default router;
