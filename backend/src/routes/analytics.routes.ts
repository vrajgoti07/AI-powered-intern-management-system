import { Router } from 'express';
import analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { analyticsQuerySchema } from '../validations/analytics.validation';

const router = Router();

// Secure all analytics endpoints under JWT authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get role-specific dashboard statistics (HR/Mentor/Intern scoped)
 * @access  Authenticated Users
 */
router.get('/dashboard', analyticsController.getDashboardStats);

/**
 * @route   GET /api/v1/analytics/interns
 * @desc    Get intern analytics with attendance, task velocity, CGPA spreads
 * @access  Authenticated Users (HR, Mentors)
 * @query   ?departmentId=&startDate=&endDate=
 */
router.get('/interns', validate(analyticsQuerySchema), analyticsController.getInternAnalytics);

/**
 * @route   GET /api/v1/analytics/mentors
 * @desc    Get mentor analytics with evaluation counts, ratings, review speeds
 * @access  Authenticated Users (HR)
 * @query   ?departmentId=
 */
router.get('/mentors', validate(analyticsQuerySchema), analyticsController.getMentorAnalytics);

/**
 * @route   GET /api/v1/analytics/departments
 * @desc    Get department-level analytics with headcounts, CGPA, task stats
 * @access  Authenticated Users (HR)
 * @query   ?departmentId=
 */
router.get('/departments', validate(analyticsQuerySchema), analyticsController.getDepartmentAnalytics);

/**
 * @route   GET /api/v1/analytics/tasks
 * @desc    Get task analytics with status/priority distributions, overdue counts
 * @access  Authenticated Users
 * @query   ?internId=&mentorId=&startDate=&endDate=
 */
router.get('/tasks', validate(analyticsQuerySchema), analyticsController.getTaskAnalytics);

export default router;
