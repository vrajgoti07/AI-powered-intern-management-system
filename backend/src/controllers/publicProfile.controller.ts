import { Request, Response, NextFunction } from 'express';
import * as publicProfileService from '../services/publicProfile.service';
import { successResponse } from '../utils/response';

/**
 * GET /api/v1/public/profile/:username
 * Fetch a public intern profile by username. No authentication required.
 */
export const getPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username } = req.params;

    if (!username || typeof username !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Username parameter is required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const profile = await publicProfileService.getPublicProfile(username);

    if (!profile) {
      res.status(404).json({
        success: false,
        message: 'This profile is private or doesn\'t exist.',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    successResponse(res, 'Public profile retrieved successfully', profile);
  } catch (error) {
    next(error);
  }
};
