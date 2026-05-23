import { Router } from 'express';
import taskController from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { uploadTaskFile } from '../utils/upload';
import {
  createTaskSchema,
  updateTaskSchema,
  taskCommentSchema,
  submitTaskSchema,
  taskQuerySchema,
} from '../validations/task.validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/tasks/analytics
 * @desc    Get task status and completion analytics
 * @access  HR, Mentor, Intern
 */
router.get('/analytics', taskController.getTaskAnalytics);

/**
 * @route   GET /api/tasks
 * @desc    Get all tasks with pagination and filters
 * @access  HR, Mentor, Intern
 */
router.get('/', validate(taskQuerySchema), taskController.getTasks);

/**
 * @route   POST /api/tasks
 * @desc    Create a new task
 * @access  Mentor only
 */
router.post(
  '/',
  authorize('MENTOR'),
  validate(createTaskSchema),
  taskController.createTask
);

/**
 * @route   GET /api/tasks/:id
 * @desc    Get task by ID
 * @access  HR, Mentor, Intern (if assigned)
 */
router.get('/:id', taskController.getTaskById);

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update a task
 * @access  Mentor, Intern (own task status only)
 */
router.put(
  '/:id',
  authorize('MENTOR', 'INTERN'),
  validate(updateTaskSchema),
  taskController.updateTask
);

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task
 * @access  Mentor only
 */
router.delete('/:id', authorize('MENTOR'), taskController.deleteTask);

/**
 * @route   POST /api/tasks/:id/submit
 * @desc    Submit an assigned task with optional file upload
 * @access  Intern only
 */
router.post(
  '/:id/submit',
  authorize('INTERN'),
  uploadTaskFile.single('file'),
  validate(submitTaskSchema),
  taskController.submitTask
);

/**
 * @route   POST /api/tasks/:id/upload
 * @desc    Upload resource/reference file for a task
 * @access  HR, Mentor, Intern
 */
router.post(
  '/:id/upload',
  uploadTaskFile.single('file'),
  taskController.uploadTaskFile
);

/**
 * @route   GET /api/tasks/:id/files
 * @desc    Get files associated with a task
 * @access  HR, Mentor, Intern
 */
router.get('/:id/files', taskController.getTaskFiles);

/**
 * @route   POST /api/tasks/:id/comments
 * @desc    Add a comment to a task
 * @access  HR, Mentor, Intern
 */
router.post(
  '/:id/comments',
  validate(taskCommentSchema),
  taskController.addTaskComment
);

/**
 * @route   GET /api/tasks/:id/comments
 * @desc    Get comments of a task
 * @access  HR, Mentor, Intern
 */
router.get('/:id/comments', taskController.getTaskComments);

export default router;
