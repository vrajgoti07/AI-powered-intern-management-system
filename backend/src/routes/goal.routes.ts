import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import {
  createGoal,
  getMyGoals,
  getMyGoalStats,
  getInternGoals,
  getGoalById,
  deleteGoal,
  triggerEvaluation,
} from '../controllers/goal.controller';

const router = Router();

// Intern endpoints
router.post('/', authenticate, authorize('INTERN'), createGoal);
router.get('/my', authenticate, authorize('INTERN'), getMyGoals);
router.get('/stats', authenticate, authorize('INTERN'), getMyGoalStats);

// Mentor/HR: view intern goals
router.get('/intern/:internId', authenticate, authorize('MENTOR', 'HR', 'SUPER_ADMIN'), getInternGoals);

// Shared: view single goal detail
router.get('/:goalId', authenticate, getGoalById);

// Delete goal
router.delete('/:goalId', authenticate, deleteGoal);

// Manual evaluation trigger (HR/Admin)
router.post('/evaluate', authenticate, authorize('HR', 'SUPER_ADMIN'), triggerEvaluation);

export default router;
