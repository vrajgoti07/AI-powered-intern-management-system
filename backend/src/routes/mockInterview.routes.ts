import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import {
  startInterview,
  submitAnswer,
  completeInterview,
  getMyInterviews,
  getOrganizationAnalytics
} from '../controllers/mockInterview.controller';

const router = Router();

router.post('/start', authenticate, authorize('INTERN'), startInterview);
router.post('/:id/answer', authenticate, authorize('INTERN'), submitAnswer);
router.post('/:id/complete', authenticate, authorize('INTERN'), completeInterview);
router.get('/my', authenticate, authorize('INTERN'), getMyInterviews);
router.get('/analytics', authenticate, authorize('MENTOR', 'HR', 'SUPER_ADMIN'), getOrganizationAnalytics);

export default router;
