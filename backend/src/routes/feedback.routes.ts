import { Router } from 'express';
import feedbackController from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createFeedbackSchema } from '../validations/feedback.validation';

const router = Router();

router.use(authenticate);

// Intern submits feedback
router.post(
  '/',
  authorize('INTERN'),
  validate(createFeedbackSchema),
  feedbackController.createFeedback
);

// HR retrieves feedbacks
router.get(
  '/hr',
  authorize('HR', 'ADMIN'),
  feedbackController.getHRFeedbacks
);

export default router;
