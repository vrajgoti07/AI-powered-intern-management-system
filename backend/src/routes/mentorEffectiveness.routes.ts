import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import mentorEffectivenessService from '../services/mentorEffectiveness.service';
import prisma from '../config/database';

const router = Router();

router.use(authenticate);

/**
 * GET /api/mentor-effectiveness/mentor/:mentorId
 * Fetch current effectiveness score analytics card details + AI insights
 */
router.get('/mentor/:mentorId', async (req, res, next) => {
  try {
    const { mentorId } = req.params;

    // Auth check: Mentors can only query their own score details
    if (req.user!.role === 'MENTOR' && req.user!.mentor?.id !== mentorId) {
      res.status(403).json({ success: false, message: 'Unauthorized to view this performance score' });
      return;
    }

    let analytics = await prisma.mentorAnalytics.findFirst({
      where: { mentorId },
    });

    // Run first-time calculation dynamically if no analysis exists yet
    let aiInsight = '';
    if (!analytics || !analytics.effectivenessScore) {
      const result = await mentorEffectivenessService.calculateMentorEffectiveness(mentorId);
      analytics = result.analytics;
      aiInsight = result.aiInsight;
    } else {
      // Pull latest AI insight text from history snapshot
      const latestHistory = await prisma.mentorEffectivenessHistory.findFirst({
        where: { mentorId },
        orderBy: { calculatedAt: 'desc' },
      });
      aiInsight = (latestHistory?.snapshot as any)?.aiInsight || 'No insight available yet.';
    }

    res.json({
      success: true,
      data: {
        ...analytics,
        aiInsight,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/mentor-effectiveness/mentor/:mentorId/history
 * Fetch historic weekly snapshots list
 */
router.get('/mentor/:mentorId/history', async (req, res, next) => {
  try {
    const { mentorId } = req.params;

    // Auth check: Mentors can only query their own score details
    if (req.user!.role === 'MENTOR' && req.user!.mentor?.id !== mentorId) {
      res.status(403).json({ success: false, message: 'Unauthorized to view this history log' });
      return;
    }

    const history = await prisma.mentorEffectivenessHistory.findMany({
      where: { mentorId },
      orderBy: { calculatedAt: 'desc' },
    });

    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/mentor-effectiveness/mentor/:mentorId/calculate
 * Force recalculate scores on-demand (HR only)
 */
router.post('/mentor/:mentorId/calculate', authorize('HR', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const result = await mentorEffectivenessService.calculateMentorEffectiveness(mentorId as string);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
