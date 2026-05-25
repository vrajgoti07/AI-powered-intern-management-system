import { Router } from 'express';
import attendanceNewController from '../controllers/attendance.new.controller';
import { cacheMiddleware } from '../middleware/cache';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Legacy Compatibility Aliases
router.post('/check-in', authorize('INTERN'), attendanceNewController.checkIn);
router.post('/check-out', authorize('INTERN'), attendanceNewController.checkOut);
router.get('/today', authorize('INTERN'), attendanceNewController.getTodayAttendance);
router.post('/mark', authorize('HR', 'MENTOR'), attendanceNewController.override);

// New Spec Endpoints
router.get('/', attendanceNewController.getRootAttendance);
router.post('/checkin', authorize('INTERN'), attendanceNewController.checkIn);
router.post('/checkout', authorize('INTERN'), attendanceNewController.checkOut);
router.get('/me', authorize('INTERN'), attendanceNewController.getMe);
router.get('/team', authorize('MENTOR'), attendanceNewController.getTeam);
router.get('/all', authorize('HR'), attendanceNewController.getAll);
router.put('/override', authorize('HR'), attendanceNewController.override);
router.get('/analytics', cacheMiddleware(300), attendanceNewController.getAttendanceAnalytics);

// Holiday Configuration Endpoints
router.get('/holidays', attendanceNewController.getHolidays);
router.post('/holidays', authorize('HR'), attendanceNewController.addHoliday);
router.delete('/holidays/:id', authorize('HR'), attendanceNewController.removeHoliday);

// Settings Endpoints
router.get('/settings', attendanceNewController.getSettings);
router.post('/settings', authorize('HR'), attendanceNewController.updateSettings);

export default router;
