import { Router } from 'express';
import * as publicProfileController from '../controllers/publicProfile.controller';
import { publicProfileLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route   GET /api/v1/public/profile/:username
 * @desc    Get a public intern profile by username
 * @access  Public (no auth required), rate limited to 100 req/min/IP
 */
router.get(
  '/profile/:username',
  publicProfileLimiter,
  publicProfileController.getPublicProfile
);

export default router;
