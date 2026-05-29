import { Router } from 'express';
import * as departmentController from '../controllers/department.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  departmentQuerySchema,
  assignHeadSchema,
  assignHeadPatchSchema,
  assignMentorSchema,
  moveInternSchema,
} from '../validations/department.validation';
import * as projectController from '../controllers/project.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/departments/hierarchy
 * @desc    Get company organizational hierarchy tree
 * @access  HR, Department Head, Mentor
 */
router.get(
  '/hierarchy',
  authorize('HR', 'DEPARTMENT_HEAD', 'MENTOR'),
  departmentController.getHierarchy
);

/**
 * @route   GET /api/departments
 * @desc    Get all departments with pagination and filters
 * @access  HR, Department Head, Mentor
 */
router.get(
  '/',
  authorize('HR', 'DEPARTMENT_HEAD', 'MENTOR'),
  validate(departmentQuerySchema),
  departmentController.getAllDepartments
);

/**
 * @route   GET /api/departments/list
 * @desc    Get all departments list (simple, no pagination)
 * @access  HR, Department Head, Mentor
 */
router.get(
  '/list',
  authorize('HR', 'DEPARTMENT_HEAD', 'MENTOR'),
  departmentController.getAllDepartmentsList
);

/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID
 * @access  HR, Department Head, Mentor
 */
router.get(
  '/:id',
  authorize('HR', 'DEPARTMENT_HEAD', 'MENTOR'),
  departmentController.getDepartmentById
);

/**
 * @route   GET /api/departments/:id/analytics
 * @desc    Get department analytics
 * @access  HR, Department Head
 */
router.get(
  '/:id/analytics',
  authorize('HR', 'DEPARTMENT_HEAD'),
  departmentController.getDepartmentAnalytics
);

/**
 * @route   GET /api/departments/:id/activity-logs
 * @desc    Get department activity history logs
 * @access  HR, Department Head
 */
router.get(
  '/:id/activity-logs',
  authorize('HR', 'DEPARTMENT_HEAD'),
  departmentController.getActivityLogs
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
 * @desc    Update department core information
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

/**
 * @route   POST /api/departments/:id/assign-head
 * @desc    Assign user as Department Head
 * @access  HR
 */
router.post(
  '/:id/assign-head',
  authorize('HR'),
  validate(assignHeadSchema),
  departmentController.assignHead
);

/**
 * @route   PATCH /api/departments/:id/assign-head
 * @desc    Assign user as Department Head (Patch method with userId body)
 * @access  HR
 */
router.patch(
  '/:id/assign-head',
  authorize('HR'),
  validate(assignHeadPatchSchema),
  departmentController.assignHeadPatch
);

/**
 * @route   POST /api/departments/:id/assign-mentor
 * @desc    Assign mentor user to department
 * @access  HR
 */
router.post(
  '/:id/assign-mentor',
  authorize('HR'),
  validate(assignMentorSchema),
  departmentController.assignMentor
);

/**
 * @route   POST /api/departments/:id/move-intern
 * @desc    Transfer intern user to department
 * @access  HR
 */
router.post(
  '/:id/move-intern',
  authorize('HR'),
  validate(moveInternSchema),
  departmentController.moveIntern
);

/**
 * @route   GET /api/departments/:id/dashboard
 * @desc    Get department dashboard metrics
 * @access  HR, Department Head
 */
router.get(
  '/:id/dashboard',
  authorize('HR', 'DEPARTMENT_HEAD'),
  departmentController.getDepartmentDashboard
);

/**
 * @route   GET /api/departments/:id/interns
 * @desc    Get interns in a department
 * @access  HR, Department Head, Mentor
 */
router.get(
  '/:id/interns',
  authorize('HR', 'DEPARTMENT_HEAD', 'MENTOR'),
  departmentController.getDepartmentInterns
);

/**
 * @route   GET /api/departments/:id/reports
 * @desc    Get department reports
 * @access  HR, Department Head
 */
router.get(
  '/:id/reports',
  authorize('HR', 'DEPARTMENT_HEAD'),
  departmentController.getDepartmentReports
);

/**
 * @route   GET /api/departments/:id/attendance
 * @desc    Get department attendance
 * @access  HR, Department Head
 */
router.get(
  '/:id/attendance',
  authorize('HR', 'DEPARTMENT_HEAD'),
  departmentController.getDepartmentAttendance
);

/**
 * @route   DELETE /api/departments/:id/mentors/:mentorId
 * @desc    Remove mentor from department
 * @access  HR
 */
router.delete(
  '/:id/mentors/:mentorId',
  authorize('HR'),
  departmentController.removeMentor
);

/**
 * @route   POST /api/departments/:id/projects
 * @desc    Create a new project in the department
 * @access  HR, Department Head
 */
router.post(
  '/:id/projects',
  authorize('HR', 'DEPARTMENT_HEAD'),
  projectController.createProject
);

/**
 * @route   GET /api/departments/:id/projects
 * @desc    Get all projects for a department
 * @access  HR, Department Head, Mentor
 */
router.get(
  '/:id/projects',
  authorize('HR', 'DEPARTMENT_HEAD', 'MENTOR'),
  projectController.getProjects
);

export default router;
