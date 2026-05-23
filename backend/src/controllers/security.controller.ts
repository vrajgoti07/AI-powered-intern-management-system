import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/error.middleware';

/**
 * Get active sessions for the authenticated user
 * GET /api/security/active-sessions
 */
export const getSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const sessions = await prisma.trustedSession.findMany({
      where: { userId },
      orderBy: { lastActivityAt: 'desc' }
    });
    successResponse(res, 'Active sessions retrieved successfully', sessions);
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate/Revoke a specific session
 * DELETE /api/security/session/:id
 */
export const terminateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const session = await prisma.trustedSession.findFirst({
      where: { id, userId }
    });

    if (!session) {
      throw new AppError('Session not found or unauthorized', 404);
    }

    await prisma.trustedSession.update({
      where: { id },
      data: { status: 'REVOKED' }
    });

    successResponse(res, 'Session terminated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Terminate all sessions for the authenticated user (Force logout everywhere)
 * DELETE /api/security/logout-all
 */
export const logoutAllSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Revoke all active trusted sessions for this user in DB
    await prisma.trustedSession.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' }
    });

    // Invalidate refresh token on user model
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null }
    });

    successResponse(res, 'All active sessions terminated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get historical login activities for the user
 */
export const getLoginActivity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const activity = await prisma.loginActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50 // Limit to last 50 activities for performance
    });
    successResponse(res, 'Login activity logs retrieved successfully', activity);
  } catch (error) {
    next(error);
  }
};
