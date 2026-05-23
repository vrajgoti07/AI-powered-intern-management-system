import { Router } from 'express';
import attendanceController from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  checkInSchema,
  checkOutSchema,
  markAttendanceSchema,
  attendanceQuerySchema,
} from '../validations/attendance.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/attendance/analytics
 * @desc    Get monthly/daily attendance statistics and percentage
 * @access  HR, Mentor, Intern
 */
router.get('/analytics', attendanceController.getAttendanceAnalytics);

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's check-in/check-out status
 * @access  Intern only
 */
router.get('/today', authorize('INTERN'), attendanceController.getTodayAttendance);

/**
 * @route   POST /api/attendance/check-in
 * @desc    Check-in today
 * @access  Intern only
 */
router.post(
  '/check-in',
  authorize('INTERN'),
  validate(checkInSchema),
  attendanceController.checkIn
);

/**
 * @route   POST /api/attendance/check-out
 * @desc    Check-out today
 * @access  Intern only
 */
router.post(
  '/check-out',
  authorize('INTERN'),
  validate(checkOutSchema),
  attendanceController.checkOut
);

/**
 * @route   GET /api/attendance
 * @desc    Get attendance records with filter parameters
 * @access  HR, Mentor, Intern
 */
router.get('/', validate(attendanceQuerySchema), attendanceController.getAttendance);

/**
 * @route   POST /api/attendance/mark
 * @desc    Manually mark attendance for an intern
 * @access  HR, Mentor only
 */
router.post(
  '/mark',
  authorize('HR', 'MENTOR'),
  validate(markAttendanceSchema),
  attendanceController.markAttendance
);

export default router;
