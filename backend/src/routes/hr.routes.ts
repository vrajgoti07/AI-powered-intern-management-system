import { Router } from 'express';
import * as hrController from '../controllers/hr.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// All routes require authentication and HR role
router.use(authenticate);
router.use(authorize('HR'));

/**
 * @route   GET /api/hr/dashboard
 * @desc    Get HR dashboard with analytics
 * @access  HR
 */
router.get('/dashboard', hrController.getHRDashboard);

/**
 * @route   GET /api/hr/users
 * @desc    Get all users with filters
 * @access  HR
 */
router.get('/users', hrController.getAllUsers);

/**
 * @route   GET /api/hr/statistics/interns
 * @desc    Get intern statistics
 * @access  HR
 */
router.get('/statistics/interns', hrController.getInternStatistics);

/**
 * @route   GET /api/hr/statistics/mentors
 * @desc    Get mentor statistics
 * @access  HR
 */
router.get('/statistics/mentors', hrController.getMentorStatistics);

/**
 * @route   PUT /api/hr/users/bulk-status
 * @desc    Bulk update user status
 * @access  HR
 */
router.put('/users/bulk-status', hrController.bulkUpdateUserStatus);

/**
 * @route   DELETE /api/hr/users/:userId
 * @desc    Delete user
 * @access  HR
 */
router.delete('/users/:userId', hrController.deleteUser);

export default router;
