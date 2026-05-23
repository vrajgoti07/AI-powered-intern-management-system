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
router.use('/leaves', leaveRequestRoutes);
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

export default router;
