import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadCertificate } from '../utils/upload';
import {
  updateProfileSchema,
  changePasswordSchema,
} from '../validations/profile.validation';

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

export default router;
