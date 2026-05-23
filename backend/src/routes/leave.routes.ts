import { Router } from 'express';
import leaveController from '../controllers/leave.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  applyLeaveSchema,
  rejectLeaveSchema,
  leaveQuerySchema,
} from '../validations/leave.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/leave/analytics
 * @desc    Get leave analytics (by status, type, count)
 * @access  HR, Mentor, Intern
 */
router.get('/analytics', leaveController.getLeaveAnalytics);

/**
 * @route   GET /api/leave/history
 * @desc    Get leave history and statistics
 * @access  HR, Mentor, Intern
 */
router.get('/history', leaveController.getLeaveHistory);

/**
 * @route   POST /api/leave/apply
 * @desc    Apply for a new leave request
 * @access  Intern only
 */
router.post(
  '/apply',
  authorize('INTERN'),
  validate(applyLeaveSchema),
  leaveController.applyLeave
);

/**
 * @route   PUT /api/leave/:id/approve
 * @desc    Approve a leave request and register 'LEAVE' in attendance
 * @access  HR, Mentor only
 */
router.put('/:id/approve', authorize('HR', 'MENTOR'), leaveController.approveLeave);

/**
 * @route   PUT /api/leave/:id/reject
 * @desc    Reject a leave request with a comment
 * @access  HR, Mentor only
 */
router.put(
  '/:id/reject',
  authorize('HR', 'MENTOR'),
  validate(rejectLeaveSchema),
  leaveController.rejectLeave
);

/**
 * @route   GET /api/leave
 * @desc    List leave requests with pagination and filters
 * @access  HR, Mentor, Intern
 */
router.get('/', validate(leaveQuerySchema), leaveController.getLeaves);

/**
 * @route   GET /api/leave/:id
 * @desc    Get specific leave details by ID
 * @access  HR, Mentor, Intern
 */
router.get('/:id', leaveController.getLeaveById);

/**
 * @route   DELETE /api/leave/:id
 * @desc    Cancel a pending leave request
 * @access  Intern only
 */
router.delete('/:id', authorize('INTERN'), leaveController.cancelLeave);

export default router;
