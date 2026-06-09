import { Request, Response, NextFunction } from 'express';
import * as profileService from '../services/profile.service';
import * as publicProfileService from '../services/publicProfile.service';
import { successResponse } from '../utils/response';
import prisma from '../config/database';

/**
 * Get user profile
 */
export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profile = await profileService.getUserProfile(req.user!.id);
    successResponse(res, 'Profile retrieved successfully', profile);
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profile = await profileService.updateUserProfile(
      req.user!.id,
      req.body
    );
    successResponse(res, 'Profile updated successfully', profile);
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 */
export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.id;
    await profileService.changeUserPassword(
      userId,
      req.body.currentPassword,
      req.body.newPassword
    );

    // Invalidate all active trusted sessions on password change
    await prisma.trustedSession.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'REVOKED' }
    });

    successResponse(res, 'Password changed successfully. Please login again.');
  } catch (error) {
    next(error);
  }
};

/**
 * Upload avatar photo
 */
export const uploadAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    let fileUrl: string;
    const filePath = (req.file as any).path || '';
    if (filePath.startsWith('http')) {
      // Cloudinary URL — use directly (convert to https if needed)
      fileUrl = filePath.replace(/^http:\/\//, 'https://');
    } else {
      // Local disk fallback
      fileUrl = `http://localhost:5000/uploads/${(req.file as any).filename}`;
    }

    const profile = await profileService.updateUserProfile(req.user!.id, {
      avatarUrl: fileUrl,
    });
    successResponse(res, 'Avatar photo uploaded successfully', profile);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove avatar photo
 */
export const removeAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const profile = await profileService.updateUserProfile(req.user!.id, {
      avatarUrl: null,
    });
    successResponse(res, 'Avatar photo removed successfully', profile);
  } catch (error) {
    next(error);
  }
};

// ─── Public Profile Settings ───────────────────────────────────────

/**
 * GET /api/v1/profile/public-settings
 * Get the authenticated user's public profile privacy settings.
 */
export const getPublicSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await publicProfileService.getPublicSettings(req.user!.id);
    successResponse(res, 'Public profile settings retrieved', settings);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/profile/public-settings
 * Update the authenticated user's public profile privacy settings.
 */
export const updatePublicSettings = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const settings = await publicProfileService.updatePublicSettings(
      req.user!.id,
      req.body
    );
    successResponse(res, 'Public profile settings updated', settings);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/profile/my-public-url
 * Get the authenticated user's public profile URL (generates username if needed).
 */
export const getMyPublicUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const url = await publicProfileService.getMyPublicUrl(req.user!.id);
    successResponse(res, 'Public profile URL generated', { url });
  } catch (error) {
    next(error);
  }
};
