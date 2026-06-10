import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as pushController from '../controllers/pushSubscription.controller';

const router = Router();

/**
 * Web Push Notification Subscription Routes
 * Base: /api/notifications/push
 */
router.use(authenticate);

router.get('/vapid-public-key', pushController.getVapidPublicKey);
router.post('/subscribe', pushController.subscribe);
router.post('/unsubscribe', pushController.unsubscribe);

export default router;
