import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import weeklyDigestService from '../services/weeklyDigest.service';
import prisma from '../config/database';
import { successResponse } from '../utils/response';

const router = Router();

// Trigger weekly digest generation for all users (organization-wide)
router.post(
  '/trigger',
  authenticate,
  authorize('HR', 'SUPER_ADMIN'),
  async (req, res, next) => {
    try {
      const orgId = req.organization?.id || null;
      const result = await weeklyDigestService.sendDigestToAllUsers(orgId);
      successResponse(res, 'Weekly digests generation triggered successfully', result);
    } catch (error) {
      next(error);
    }
  }
);

// Preview weekly digest for a specific user dynamically
router.get(
  '/preview/:userId',
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.params.userId as string;
      
      // Allow user to preview their own, or require HR / SUPER_ADMIN
      if (req.user!.id !== userId && !['HR', 'SUPER_ADMIN'].includes(req.user!.role)) {
        res.status(403).json({ success: false, message: 'Forbidden. You can only preview your own digest.' });
        return;
      }
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { intern: true, mentor: true }
      });
      
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }
      
      const endOfWeek = new Date();
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      
      const startStr = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const endStr = endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const weekRangeStr = `${startStr} – ${endStr}`;
      
      let telemetryData: any = null;
      
      if (user.role === 'INTERN' && user.intern) {
        telemetryData = await weeklyDigestService.gatherInternTelemetry(user.intern.id, startOfWeek, endOfWeek);
      } else if (user.role === 'MENTOR' && user.mentor) {
        telemetryData = await weeklyDigestService.gatherMentorTelemetry(user.mentor.id, startOfWeek, endOfWeek);
      } else if (user.role === 'HR' || user.role === 'SUPER_ADMIN') {
        telemetryData = await weeklyDigestService.gatherHRTelemetry(user.organizationId, startOfWeek, endOfWeek);
      } else {
        res.status(400).json({ success: false, message: 'User role does not participate in weekly digests.' });
        return;
      }
      
      const aiInsight = await weeklyDigestService.generateAIDigest(user.role, user.name, telemetryData);
      
      successResponse(res, 'Digest preview generated successfully', {
        role: user.role,
        weekRange: weekRangeStr,
        telemetry: telemetryData,
        aiInsight
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
