import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as standupController from '../controllers/standup.controller';

const router = Router();

/**
 * Daily Standup Bot Routing Paths
 * Base: /api/standups
 */
router.use(authenticate);

router.get('/today', standupController.getTodayMyStandup);
router.post('/submit', standupController.submitMyStandup);
router.get('/my-history', standupController.getMyStandupHistory);
router.get('/team', standupController.getOrgTeamStandups);
router.get('/settings', standupController.getOrgSettings);
router.put('/settings', standupController.updateOrgSettings);

export default router;
