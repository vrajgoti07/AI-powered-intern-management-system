import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  reportQuerySchema,
  exportPdfQuerySchema,
  exportExcelQuerySchema,
} from '../validations/analytics.validation';

const router = Router();

// Secure all report endpoints under JWT authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/reports/performance
 * @desc    Get performance report JSON for an intern
 * @access  Authenticated Users
 * @query   ?internId= (required)
 */
router.get('/performance', validate(reportQuerySchema), reportController.getPerformanceReport);

/**
 * @route   GET /api/v1/reports/attendance
 * @desc    Get attendance report JSON with daily records and summary
 * @access  Authenticated Users
 * @query   ?internId= (required) &startDate= &endDate=
 */
router.get('/attendance', validate(reportQuerySchema), reportController.getAttendanceReport);

/**
 * @route   GET /api/v1/reports/internship-summary
 * @desc    Get internship summary with graduation eligibility
 * @access  Authenticated Users
 * @query   ?internId= (required)
 */
router.get('/internship-summary', validate(reportQuerySchema), reportController.getInternshipSummary);

/**
 * @route   GET /api/v1/reports/export-pdf
 * @desc    Export PDF document (attendance, performance, completion certificate, or summary)
 * @access  Authenticated Users
 * @query   ?type=attendance|performance|completion|summary &internId= &startDate= &endDate=
 */
router.get('/export-pdf', validate(exportPdfQuerySchema), reportController.exportPDF);

/**
 * @route   GET /api/v1/reports/export-excel
 * @desc    Export Excel document (attendance, tasks, or departments)
 * @access  Authenticated Users
 * @query   ?type=attendance|tasks|departments &internId= &departmentId= &startDate= &endDate=
 */
router.get('/export-excel', validate(exportExcelQuerySchema), reportController.exportExcel);

export default router;
