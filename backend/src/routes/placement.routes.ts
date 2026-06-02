import { Router } from 'express';
import placementController from '../controllers/placement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// All placement routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/placements
 * @desc    Create a pending placement, checks availability, runs AI risk and sends emails
 * @access  HR
 */
router.post(
  '/',
  authorize('HR', 'SUPER_ADMIN'),
  placementController.createPlacement
);

/**
 * @route   DELETE /api/placements/:id/undo
 * @desc    Undo pending placement within the 30-second window
 * @access  HR
 */
router.delete(
  '/:id/undo',
  authorize('HR', 'SUPER_ADMIN'),
  placementController.undoPlacement
);

/**
 * @route   GET /api/placements/history
 * @desc    Retrieve paginated placement history
 * @access  HR
 */
router.get(
  '/history',
  authorize('HR', 'SUPER_ADMIN'),
  placementController.getHistory
);

/**
 * @route   POST /api/placements/bulk
 * @desc    Sequentially apply a batch of placements
 * @access  HR
 */
router.post(
  '/bulk',
  authorize('HR', 'SUPER_ADMIN'),
  placementController.bulkPlacements
);

/**
 * @route   GET /api/placements/export/csv
 * @desc    Export all placement history as CSV
 * @access  HR
 */
router.get(
  '/export/csv',
  authorize('HR', 'SUPER_ADMIN'),
  placementController.exportCSV
);

/**
 * @route   POST /api/placements/match-score
 * @desc    AI Feature 1 - Calculate Compatibility Match Score using Claude/GPT-4o
 * @access  HR
 */
router.post(
  '/match-score',
  authorize('HR', 'SUPER_ADMIN'),
  placementController.getAIMatchScore
);

/**
 * @route   POST /api/placements/insights
 * @desc    AI Feature 2 - Generate AI Smart Match Reasoning
 * @access  HR
 */
router.post(
  '/insights',
  authorize('HR', 'SUPER_ADMIN'),
  placementController.getAIInsights
);

/**
 * @route   GET /api/placements/recommendations
 * @desc    Get populated recommendations list with IDs and departments
 * @access  HR
 */
router.get(
  '/recommendations',
  authorize('HR', 'SUPER_ADMIN'),
  placementController.getRecommendations
);

export default router;
