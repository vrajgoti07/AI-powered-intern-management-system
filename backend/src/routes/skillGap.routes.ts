import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import skillGapService from '../services/skillGap.service';
import prisma from '../config/database';

const router = Router();

router.use(authenticate);

/**
 * GET /api/skill-gap/intern/:internId
 * Fetch skill gap analysis dashboard data for a single intern
 */
router.get('/intern/:internId', async (req, res, next) => {
  try {
    const { internId } = req.params;
    
    // Auth check: Interns can only view their own dashboard
    if (req.user!.role === 'INTERN' && req.user!.intern?.id !== internId) {
      res.status(403).json({ success: false, message: 'Unauthorized to view this skill profile' });
      return;
    }

    let gapAnalysis = await prisma.skillGapAnalysis.findUnique({
      where: { internId },
    });

    // Run first-time calculation dynamically if no analysis exists yet
    if (!gapAnalysis) {
      gapAnalysis = await skillGapService.analyzeInternSkillGap(internId);
    }

    res.json({ success: true, data: gapAnalysis });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/skill-gap/intern/:internId/refresh
 * Force re-calculate/refresh skill gap recommendations on-demand
 */
router.post('/intern/:internId/refresh', async (req, res, next) => {
  try {
    const { internId } = req.params;

    // Auth check: Interns can only refresh their own dashboard
    if (req.user!.role === 'INTERN' && req.user!.intern?.id !== internId) {
      res.status(403).json({ success: false, message: 'Unauthorized to refresh this skill profile' });
      return;
    }

    const gapAnalysis = await skillGapService.analyzeInternSkillGap(internId);
    res.json({ success: true, data: gapAnalysis });
  } catch (error) {
    next(error);
  }
});

export default router;
