import { Router } from 'express';
import * as departmentController from '../controllers/department.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentQuerySchema,
} from '../validations/department.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/departments
 * @desc    Get all departments with pagination and filters
 * @access  HR, Mentor
 */
router.get(
  '/',
  authorize('HR', 'MENTOR'),
  validate(departmentQuerySchema),
  departmentController.getAllDepartments
);

/**
 * @route   GET /api/departments/list
 * @desc    Get all departments list (simple, no pagination)
 * @access  HR, Mentor
 */
router.get(
  '/list',
  authorize('HR', 'MENTOR'),
  departmentController.getAllDepartmentsList
);

/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID
 * @access  HR, Mentor
 */
router.get(
  '/:id',
  authorize('HR', 'MENTOR'),
  departmentController.getDepartmentById
);

/**
 * @route   GET /api/departments/:id/analytics
 * @desc    Get department analytics
 * @access  HR
 */
router.get(
  '/:id/analytics',
  authorize('HR'),
  departmentController.getDepartmentAnalytics
);

/**
 * @route   POST /api/departments
 * @desc    Create new department
 * @access  HR
 */
router.post(
  '/',
  authorize('HR'),
  validate(createDepartmentSchema),
  departmentController.createDepartment
);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  HR
 */
router.put(
  '/:id',
  authorize('HR'),
  validate(updateDepartmentSchema),
  departmentController.updateDepartment
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department
 * @access  HR
 */
router.delete(
  '/:id',
  authorize('HR'),
  departmentController.deleteDepartment
);

export default router;
