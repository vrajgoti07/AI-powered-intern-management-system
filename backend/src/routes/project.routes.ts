import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   PUT /api/projects/:id
 * @desc    Update project details
 * @access  HR, Department Head, Mentor
 */
router.put(
  '/:id',
  authorize('HR', 'DEPARTMENT_HEAD', 'MENTOR'),
  projectController.updateProject
);

/**
 * @route   POST /api/projects/:id/interns
 * @desc    Assign intern to project
 * @access  HR, Department Head, Mentor
 */
router.post(
  '/:id/interns',
  authorize('HR', 'DEPARTMENT_HEAD', 'MENTOR'),
  projectController.assignIntern
);

export default router;
