import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as gamificationController from '../controllers/gamification.controller';

const router = Router();

/**
 * Gamification Features Routes
 * Base: /api/gamification
 */
router.use(authenticate);

router.get('/stats', gamificationController.getMyStats);
router.get('/leaderboard', gamificationController.getOrgLeaderboard);
router.get('/badges', gamificationController.getAllBadges);

export default router;
