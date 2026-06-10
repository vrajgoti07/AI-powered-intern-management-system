import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import cohortAnalyticsService from '../services/cohortAnalytics.service';

const router = Router();

router.use(authenticate);

/**
 * GET /api/analytics/cohorts/batches
 * List all batches
 */
router.get('/batches', async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId!;
    const batches = await cohortAnalyticsService.getBatches(orgId);
    res.json({ success: true, data: batches });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analytics/cohorts/batches
 * Create a new internship batch
 */
router.post('/batches', authorize('HR', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId!;
    const { name, startDate, endDate, description } = req.body;

    if (!name || !startDate || !endDate) {
      res.status(400).json({ success: false, message: 'Name, startDate, and endDate are required' });
      return;
    }

    const batch = await cohortAnalyticsService.createBatch({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      description,
      organizationId: orgId,
    });

    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/analytics/cohorts/batches/:batchId/interns
 * Add interns to a batch
 */
router.post('/batches/:batchId/interns', authorize('HR', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { internIds } = req.body;

    if (!internIds || !Array.isArray(internIds)) {
      res.status(400).json({ success: false, message: 'internIds array is required' });
      return;
    }

    await cohortAnalyticsService.addInternsToBatch(batchId as string, internIds);
    res.json({ success: true, message: 'Interns successfully added to batch.' });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/cohorts/compare
 * Compare batches side-by-side
 */
router.get('/compare', async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId!;
    const { batchIds } = req.query;

    if (!batchIds) {
      res.status(400).json({ success: false, message: 'batchIds query parameter is required (comma-separated list)' });
      return;
    }

    const ids = (batchIds as string).split(',');
    const comparison = await cohortAnalyticsService.compareBatches(ids, orgId);

    res.json({ success: true, data: comparison });
  } catch (error) {
    next(error);
  }
});

export default router;
