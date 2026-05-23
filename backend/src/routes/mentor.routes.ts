import { Router } from 'express';
import * as mentorController from '../controllers/mentor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createMentorSchema,
  updateMentorSchema,
  assignInternsSchema,
  mentorQuerySchema,
} from '../validations/mentor.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/mentors
 * @desc    Get all mentors with pagination and filters
 * @access  HR, Mentor
 */
router.get(
  '/',
  authorize('HR', 'MENTOR'),
  validate(mentorQuerySchema),
  mentorController.getAllMentors
);

/**
 * @route   GET /api/mentors/:id
 * @desc    Get mentor by ID
 * @access  HR, Mentor
 */
router.get(
  '/:id',
  authorize('HR', 'MENTOR'),
  mentorController.getMentorById
);

/**
 * @route   GET /api/mentors/user/:userId
 * @desc    Get mentor by user ID
 * @access  HR, Mentor
 */
router.get(
  '/user/:userId',
  authorize('HR', 'MENTOR'),
  mentorController.getMentorByUserId
);

/**
 * @route   GET /api/mentors/:id/interns
 * @desc    Get assigned interns for a mentor
 * @access  HR, Mentor (own interns)
 */
router.get(
  '/:id/interns',
  authorize('HR', 'MENTOR'),
  mentorController.getAssignedInterns
);

/**
 * @route   POST /api/mentors
 * @desc    Create new mentor
 * @access  HR
 */
router.post(
  '/',
  authorize('HR'),
  validate(createMentorSchema),
  mentorController.createMentor
);

/**
 * @route   PUT /api/mentors/:id
 * @desc    Update mentor
 * @access  HR, Mentor (own profile)
 */
router.put(
  '/:id',
  authorize('HR', 'MENTOR'),
  validate(updateMentorSchema),
  mentorController.updateMentor
);

/**
 * @route   DELETE /api/mentors/:id
 * @desc    Delete mentor
 * @access  HR
 */
router.delete(
  '/:id',
  authorize('HR'),
  mentorController.deleteMentor
);

/**
 * @route   PUT /api/mentors/:id/assign-interns
 * @desc    Assign interns to mentor
 * @access  HR
 */
router.put(
  '/:id/assign-interns',
  authorize('HR'),
  validate(assignInternsSchema),
  mentorController.assignInterns
);

export default router;
