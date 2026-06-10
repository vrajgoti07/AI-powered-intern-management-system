import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { successResponse } from '../utils/response';
import * as gamificationService from '../services/gamification.service';
import prisma from '../config/database';

/**
 * Get the current user's gamification statistics (level, XP, badges, recent transactions)
 * GET /api/gamification/stats
 */
export const getMyStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (req.user?.role !== 'INTERN') {
    throw new AppError('Only interns have access to personal gamification stats.', 403);
  }

  const stats = await gamificationService.getUserStats(req.user.id);
  successResponse(res, 'Gamification stats retrieved successfully', stats);
});

/**
 * Get the organization's leaderboards (Top 10)
 * GET /api/gamification/leaderboard
 */
export const getOrgLeaderboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.user?.organizationId;

  if (!organizationId) {
    throw new AppError('Organization context not established for your user account.', 400);
  }

  const leaderboard = await gamificationService.getLeaderboard(organizationId);
  successResponse(res, 'Leaderboard retrieved successfully', leaderboard);
});

/**
 * Retrieve all system-wide badge templates
 * GET /api/gamification/badges
 */
export const getAllBadges = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const badges = await prisma.badge.findMany({
    orderBy: { category: 'asc' },
  });
  successResponse(res, 'Badges list retrieved successfully', badges);
});
