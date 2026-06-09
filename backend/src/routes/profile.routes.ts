import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadCertificate } from '../utils/upload';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../validations/profile.validation';
import { updatePublicSettingsSchema } from '../validations/publicProfile.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/profile
 * @desc    Get current user profile
 * @access  All authenticated users
 */
router.get('/', profileController.getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update current user profile
 * @access  All authenticated users
 */
router.put(
  '/',
  validate(updateProfileSchema),
  profileController.updateProfile
);

/**
 * @route   POST /api/profile/avatar
 * @desc    Upload avatar photo
 * @access  All authenticated users
 */
router.post(
  '/avatar',
  uploadCertificate.single('file'),
  profileController.uploadAvatar
);

/**
 * @route   DELETE /api/profile/avatar
 * @desc    Remove avatar photo
 * @access  All authenticated users
 */
router.delete(
  '/avatar',
  profileController.removeAvatar
);

/**
 * @route   PUT /api/profile/change-password
 * @desc    Change password
 * @access  All authenticated users
 */
router.put(
  '/change-password',
  validate(changePasswordSchema),
  profileController.changePassword
);

// ─── Public Profile Settings ───────────────────────────────────────

/**
 * @route   GET /api/profile/public-settings
 * @desc    Get own public profile privacy settings
 * @access  All authenticated users
 */
router.get('/public-settings', profileController.getPublicSettings);

/**
 * @route   PUT /api/profile/public-settings
 * @desc    Update public profile privacy settings
 * @access  All authenticated users
 */
router.put(
  '/public-settings',
  validate(updatePublicSettingsSchema),
  profileController.updatePublicSettings
);

/**
 * @route   GET /api/profile/my-public-url
 * @desc    Get own public profile URL (generates username if needed)
 * @access  All authenticated users
 */
router.get('/my-public-url', profileController.getMyPublicUrl);

export default router;

