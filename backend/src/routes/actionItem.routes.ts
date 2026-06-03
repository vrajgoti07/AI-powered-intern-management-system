import { Router } from 'express';
import feedbackController from '../controllers/feedback.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Fetch action items (scoped by logged-in role)
router.get('/', feedbackController.getActionItems);

// Check off / update action item status
router.patch('/:id', feedbackController.updateActionItem);

export default router;
