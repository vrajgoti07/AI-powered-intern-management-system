import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { emailQueue } from '../queues/queue.config';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { asyncHandler } from '../middleware/error.middleware';

const router = Router();

// Only Super Admins can access email logs and test emails
router.use(authenticate, authorize('SUPER_ADMIN'));

/**
 * @route   POST /api/v1/emails/test
 * @desc    Send a test email to the logged-in admin user
 * @access  Private (SUPER_ADMIN)
 */
router.post('/test', asyncHandler(async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.email) {
      res.status(400).json({ success: false, message: 'User email not found' });
      return;
    }

    await emailQueue.add('WELCOME_EMAIL', {
      to: req.user.email,
      data: {
        name: req.user.name,
        email: req.user.email,
        temporaryPassword: 'test-password-123',
        loginUrl: process.env.FRONTEND_URL || 'http://localhost:3000/login',
        companyName: 'Test Company'
      }
    });

    res.json({ success: true, message: 'Test email added to queue' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

/**
 * @route   GET /api/v1/emails/logs
 * @desc    List email logs with pagination
 * @access  Private (SUPER_ADMIN)
 */
router.get('/logs', asyncHandler(async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const logs = await prisma.emailLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.emailLog.count();

    res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

/**
 * @route   POST /api/v1/emails/resend/:logId
 * @desc    Resend a failed email
 * @access  Private (SUPER_ADMIN)
 */
router.post('/resend/:logId', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { logId } = req.params;

    const log = await prisma.emailLog.findUnique({ where: { id: logId as string } });
    if (!log) {
      res.status(404).json({ success: false, message: 'Email log not found' });
      return;
    }

    if (!log.templateName) {
      res.status(400).json({ success: false, message: 'Missing template name, cannot resend' });
      return;
    }

    // Since we don't store the exact data payload in EmailLog (we could if we want),
    // we would ideally need the data. For this implementation, if data is required,
    // we'll fetch the user and try to recreate it, OR we'd store it in the db.
    // Given the current schema without a data column, we'll try a generic resend.
    // If the template needs specific data, this might fail unless we reconstruct it.
    
    // For simplicity, we just add it to queue with empty data or tell the user to trigger it from the source.
    res.status(501).json({ success: false, message: 'Resend requires data payload which is not stored in logs. Implement payload storage first.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}));

export default router;
