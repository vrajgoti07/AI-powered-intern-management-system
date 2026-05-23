import { Router } from 'express';
import * as securityController from '../controllers/security.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/sessions', securityController.getSessions);
router.get('/active-sessions', securityController.getSessions);
router.delete('/session/:id', securityController.terminateSession);
router.delete('/logout-all', securityController.logoutAllSessions);
router.get('/login-activity', securityController.getLoginActivity);

export default router;
