import { Router } from 'express';
import * as settingsController from '../controllers/settings.controller';
import { authenticate } from '../middleware/auth.middleware';
import { uploadCertificate } from '../utils/upload';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/profile', settingsController.getProfile);
router.put('/profile', uploadCertificate.single('file'), settingsController.updateProfile);

router.get('/notifications', settingsController.getNotifications);
router.put('/notifications', settingsController.updateNotifications);

export default router;
