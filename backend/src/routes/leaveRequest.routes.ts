import { Router } from 'express';
import leaveRequestController from '../controllers/leaveRequest.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Legacy Compatibility Aliases
router.get('/', leaveRequestController.getAll);
router.post('/apply', authorize('INTERN'), leaveRequestController.applyLeave);
router.put('/:id/approve', authorize('HR', 'MENTOR'), leaveRequestController.approveLeave);
router.put('/:id/reject', authorize('HR', 'MENTOR'), leaveRequestController.rejectLeave);

// New Spec Endpoints
router.post('/request', authorize('INTERN'), leaveRequestController.requestLeave);
router.put('/mentor-approve', authorize('MENTOR'), leaveRequestController.mentorApprove);
router.put('/hr-approve', authorize('HR'), leaveRequestController.hrApprove);
router.get('/all', leaveRequestController.getAll);
router.put('/reject', authorize('MENTOR', 'HR'), leaveRequestController.rejectLeave);

export default router;
