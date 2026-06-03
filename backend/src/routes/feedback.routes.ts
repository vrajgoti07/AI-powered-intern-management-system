import { Router } from 'express';
import feedbackController from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate);

// HR aggregated insights
router.get(
  '/insights',
  authorize('HR', 'SUPER_ADMIN', 'MENTOR'),
  feedbackController.getHRInsights
);

// Consolidated HR Admin route
router.get(
  '/all',
  authorize('HR', 'ADMIN', 'SUPER_ADMIN'),
  feedbackController.getHRAllData
);

// Consolidated Mentor route
router.get(
  '/mentor/:mentorId',
  authorize('HR', 'ADMIN', 'SUPER_ADMIN', 'MENTOR', 'DEPARTMENT_HEAD'),
  feedbackController.getMentorAllData
);

// Consolidated Intern route
router.get(
  '/intern/:internId',
  authorize('HR', 'ADMIN', 'SUPER_ADMIN', 'INTERN'),
  feedbackController.getInternAllData
);

// Scoped feedback history
router.get(
  '/history',
  feedbackController.getFeedbackHistory
);

// Intern submits self-evaluation reflection
router.post(
  '/intern',
  authorize('INTERN'),
  feedbackController.createFeedback
);

// Mentor submits feedback for Intern
router.post(
  '/mentor',
  authorize('MENTOR'),
  feedbackController.createMentorFeedback
);

// HR retrieves feedbacks list
router.get(
  '/hr',
  authorize('HR', 'ADMIN', 'SUPER_ADMIN'),
  feedbackController.getHRFeedbacks
);

// Seed realistic demo feedback and action items data
router.post(
  '/seed',
  authorize('HR', 'ADMIN', 'SUPER_ADMIN'),
  feedbackController.seedFeedbackData
);

export default router;
