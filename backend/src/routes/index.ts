import { Router } from 'express';
import authRoutes from './auth.routes';
import internRoutes from './intern.routes';
import mentorRoutes from './mentor.routes';
import departmentRoutes from './department.routes';
import profileRoutes from './profile.routes';
import hrRoutes from './hr.routes';
import taskRoutes from './task.routes';
import attendanceNewRoutes from './attendance.new.routes';
import leaveRequestRoutes from './leaveRequest.routes';
import chatRoutes from './chat.routes';
import notificationRoutes from './notification.routes';
import aiRoutes from './ai.routes';
import analyticsRoutes from './analytics.routes';
import reportRoutes from './report.routes';
import feedbackRoutes from './feedback.routes';
import announcementRoutes from './announcement.routes';
import mentorDetailsRoutes from './mentorDetails.routes';
import onboardingRoutes from './onboarding.routes';
import securityRoutes from './security.routes';
import settingsRoutes from './settings.routes';
import auditLogRoutes from './auditLog.routes';
import restoreRoutes from './restore.routes';
import projectRoutes from './project.routes';
import emailRoutes from './email.routes';
import documentRoutes from './document.routes';
import placementRoutes from './placement.routes';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import prisma from '../config/database';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

/**
 * Mount routes
 */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, company, size, subject, message } = req.body;
    if (!name || !email || !message) {
      res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
      return;
    }
    const { emailQueue } = await import('../queues/queue.config');
    await emailQueue.add('CONTACT_FORM_SUBMISSION', {
      to: process.env.ADMIN_EMAIL || 'admin@internflow.io',
      data: { name, email, company: company || 'Not provided', size: size || 'Not provided', subject: subject || 'General Inquiry', message, submittedAt: new Date().toISOString() }
    });
    await emailQueue.add('CONTACT_FORM_CONFIRMATION', { to: email, data: { name, subject: subject || 'General Inquiry' } });
    res.json({ success: true, message: 'Your message has been received. Our team will respond within 24 hours.' });
  } catch (error: any) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
});

router.use('/auth', authRoutes);
router.use('/interns', internRoutes);
router.use('/mentors', mentorRoutes);
router.use('/departments', departmentRoutes);
router.use('/profile', profileRoutes);
router.use('/hr', hrRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/tasks', taskRoutes);
router.use('/attendance', attendanceNewRoutes);
router.use('/leave', leaveRequestRoutes);
router.use('/messages', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/announcements', announcementRoutes);
router.use('/hr/mentors', mentorDetailsRoutes);
router.use('/security', securityRoutes);
router.use('/settings', settingsRoutes);
router.use('/admin/audit-logs', auditLogRoutes);
router.use('/admin', restoreRoutes);
router.use('/projects', projectRoutes);
router.use('/emails', emailRoutes);
router.use('/documents', documentRoutes);
router.use('/placements', placementRoutes);

/**
 * GET /api/intern/dashboard-stats
 * returns stats metrics for the logged-in intern
 */
router.get(
  '/intern/dashboard-stats',
  authenticate,
  authorize('INTERN'),
  async (req, res) => {
    try {
      const intern = req.user.intern;
      if (!intern) {
        res.status(404).json({
          success: false,
          message: 'Intern profile not found',
        });
        return;
      }

      const taskCount = await prisma.task.count({
        where: { internId: intern.id },
      });

      const completedTasks = await prisma.task.count({
        where: { 
          internId: intern.id,
          status: 'COMPLETED',
        },
      });

      const pendingLeaves = await prisma.leave.count({
        where: {
          internId: intern.id,
          status: 'PENDING',
        },
      });

      res.json({
        success: true,
        data: {
          taskCount,
          completedTasks,
          attendancePercent: intern.attendance,
          performanceScore: intern.score,
          pendingLeaves,
        },
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

/**
 * GET /api/users/me
 * returns user details along with the associated intern/mentor details
 */
router.get(
  '/users/me',
  authenticate,
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          intern: {
            include: {
              department: true,
              mentor: {
                include: {
                  user: true,
                },
              },
            },
          },
          mentor: {
            include: {
              department: true,
            },
          },
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
      return;
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
      return;
    }
  }
);

export default router;
