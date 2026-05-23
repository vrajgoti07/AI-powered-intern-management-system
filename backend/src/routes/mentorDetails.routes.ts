import { Router } from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';
import * as mentorDetailsController from '../controllers/mentorDetails.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateMentorProfileSchema,
  assignInternToMentorSchema,
  activityQuerySchema,
} from '../validations/mentorDetails.validation';

const router = Router();

// All routes require HR authentication
router.use(authenticate);
router.use(authorize('HR', 'SUPER_ADMIN'));

// Cloudinary multer storage for mentor documents
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: 'mentor-documents',
    allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    resource_type: 'auto',
  } as any,
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * @route   GET /api/v1/hr/mentors/:id/details
 * @desc    Get comprehensive mentor details
 * @access  HR
 */
router.get('/:id/details', mentorDetailsController.getMentorDetails);

/**
 * @route   PUT /api/v1/hr/mentors/:id/profile
 * @desc    Update mentor profile
 * @access  HR
 */
router.put(
  '/:id/profile',
  validate(updateMentorProfileSchema),
  mentorDetailsController.updateMentorProfile
);

/**
 * @route   GET /api/v1/hr/mentors/:id/analytics
 * @desc    Get mentor analytics
 * @access  HR
 */
router.get('/:id/analytics', mentorDetailsController.getMentorAnalytics);

/**
 * @route   POST /api/v1/hr/mentors/:id/analytics/refresh
 * @desc    Recompute mentor analytics from source data
 * @access  HR
 */
router.post('/:id/analytics/refresh', mentorDetailsController.refreshMentorAnalytics);

/**
 * @route   GET /api/v1/hr/mentors/:id/activity
 * @desc    Get mentor activity timeline
 * @access  HR
 */
router.get(
  '/:id/activity',
  validate(activityQuerySchema),
  mentorDetailsController.getMentorActivity
);

/**
 * @route   GET /api/v1/hr/mentors/:id/interns
 * @desc    Get assigned interns with performance data
 * @access  HR
 */
router.get('/:id/interns', mentorDetailsController.getMentorInterns);

/**
 * @route   POST /api/v1/hr/mentors/:id/assign-intern
 * @desc    Assign a single intern to mentor
 * @access  HR
 */
router.post(
  '/:id/assign-intern',
  validate(assignInternToMentorSchema),
  mentorDetailsController.assignInternToMentor
);

/**
 * @route   DELETE /api/v1/hr/mentors/:id/remove-intern/:internId
 * @desc    Remove intern from mentor
 * @access  HR
 */
router.delete('/:id/remove-intern/:internId', mentorDetailsController.removeInternFromMentor);

/**
 * @route   GET /api/v1/hr/mentors/:id/documents
 * @desc    Get all mentor documents
 * @access  HR
 */
router.get('/:id/documents', mentorDetailsController.getMentorDocuments);

/**
 * @route   POST /api/v1/hr/mentors/:id/documents
 * @desc    Upload a mentor document
 * @access  HR
 */
router.post(
  '/:id/documents',
  upload.single('file'),
  mentorDetailsController.uploadMentorDocument
);

/**
 * @route   DELETE /api/v1/hr/mentors/:id/documents/:docId
 * @desc    Delete a mentor document
 * @access  HR
 */
router.delete('/:id/documents/:docId', mentorDetailsController.deleteMentorDocument);

/**
 * @route   GET /api/v1/hr/mentors/:id/workload
 * @desc    Get mentor workload analysis
 * @access  HR
 */
router.get('/:id/workload', mentorDetailsController.getMentorWorkload);

/**
 * @route   POST /api/v1/hr/mentors/:id/ai-analysis
 * @desc    Trigger AI effectiveness analysis
 * @access  HR
 */
router.post('/:id/ai-analysis', mentorDetailsController.getAIAnalysis);

export default router;
