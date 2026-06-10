import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  initiateCall,
  endCall,
  getCallHistory
} from '../controllers/videoCall.controller';

const router = Router();

// Protect all video call routes with JWT authentication
router.use(authenticate);

router.post('/initiate', initiateCall);
router.post('/end', endCall);
router.get('/history', getCallHistory);

export default router;
