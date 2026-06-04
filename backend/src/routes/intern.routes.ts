import { Router } from 'express';
import * as internController from '../controllers/intern.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadCertificate } from '../utils/upload';
import {
  applyInternSchema,
  createInternSchema,
  updateInternSchema,
  assignMentorSchema,
  updateSkillsSchema,
  internQuerySchema,
} from '../validations/intern.validation';

import prisma from '../config/database';

const router = Router();

/**
 * @route   POST /api/interns/apply
 * @desc    Public endpoint for candidate application submission
 * @access  Public
 */
router.post(
  '/apply',
  validate(applyInternSchema),
  internController.applyIntern
);

/**
 * @route   GET /api/interns/check-email?email=xxx
 * @desc    Public lightweight duplicate email check for the apply form
 * @access  Public
 */
router.get('/check-email', async (req: any, res: any) => {
  const { email } = req.query;
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, message: 'Email query param required.' });
  }
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true }
  });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'An application with this email address already exists. Please check your inbox or contact HR if you need help.'
    });
  }
  return res.json({ success: true, message: 'Email is available.' });
});

// All routes below require authentication
router.use(authenticate);

/**
 * @route   GET /api/interns/view-document
 * @desc    View onboarding documents inline via backend secure stream
 * @access  Authenticated
 */
router.get(
  '/view-document',
  internController.viewDocument
);

/**
 * @route   PUT /api/interns/me/onboarding
 * @desc    Save onboarding form data for the logged-in intern
 * @access  Intern only
 */
router.put(
  '/me/onboarding',
  authorize('INTERN'),
  internController.updateOnboarding
);

/**
 * @route   POST /api/interns/me/onboarding/upload
 * @desc    Upload onboarding document (idProof, marksheet, resume) to Cloudinary
 * @access  Intern only
 * @query   docType - 'idProof' | 'marksheet' | 'resume'
 */
router.post(
  '/me/onboarding/upload',
  authorize('INTERN'),
  uploadCertificate.single('file'),
  internController.uploadOnboardingDoc
);

/**
 * @route   DELETE /api/interns/me/onboarding/remove
 * @desc    Remove onboarding document
 * @access  Intern only
 * @query   docType
 */
router.delete(
  '/me/onboarding/remove',
  authorize('INTERN'),
  internController.removeOnboardingDoc
);

/**
 * @route   GET /api/interns
 * @desc    Get all interns with pagination and filters
 * @access  HR, Mentor
 */
router.get(
  '/',
  authorize('HR', 'MENTOR'),
  validate(internQuerySchema),
  internController.getAllInterns
);

/**
 * @route   GET /api/interns/:id
 * @desc    Get intern by ID
 * @access  HR, Mentor, Intern (own profile)
 */
router.get(
  '/:id',
  authorize('HR', 'MENTOR', 'INTERN'),
  internController.getInternById
);

/**
 * @route   GET /api/interns/user/:userId
 * @desc    Get intern by user ID
 * @access  HR, Mentor, Intern (own profile)
 */
router.get(
  '/user/:userId',
  authorize('HR', 'MENTOR', 'INTERN'),
  internController.getInternByUserId
);

/**
 * @route   POST /api/interns
 * @desc    Create new intern
 * @access  HR
 */
router.post(
  '/',
  authorize('HR'),
  validate(createInternSchema),
  internController.createIntern
);

/**
 * @route   PUT /api/interns/:id
 * @desc    Update intern
 * @access  HR, Mentor, Intern (own profile)
 */
router.put(
  '/:id',
  authorize('HR', 'MENTOR', 'INTERN'),
  validate(updateInternSchema),
  internController.updateIntern
);

/**
 * @route   DELETE /api/interns/:id
 * @desc    Delete intern
 * @access  HR
 */
router.delete(
  '/:id',
  authorize('HR'),
  internController.deleteIntern
);

/**
 * @route   PUT /api/interns/:id/assign-mentor
 * @desc    Assign mentor to intern
 * @access  HR
 */
router.put(
  '/:id/assign-mentor',
  authorize('HR'),
  validate(assignMentorSchema),
  internController.assignMentor
);

/**
 * @route   PUT /api/interns/:id/skills
 * @desc    Update intern skills
 * @access  HR, Mentor, Intern (own profile)
 */
router.put(
  '/:id/skills',
  authorize('HR', 'MENTOR', 'INTERN'),
  validate(updateSkillsSchema),
  internController.updateSkills
);

export default router;
