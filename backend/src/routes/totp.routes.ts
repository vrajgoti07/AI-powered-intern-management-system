import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as totpController from '../controllers/totp.controller';

const router = Router();

/**
 * 2FA (Two-Factor Authentication) Routes
 * 
 * Public:
 *   POST /verify    - Validate 2FA code during login
 * 
 * Authenticated:
 *   POST /setup     - Initiate 2FA secret generation + QR
 *   POST /enable    - Verify token and activate 2FA
 *   POST /disable   - Disable 2FA
 *   GET  /status    - Retrieve active 2FA status
 */

router.post('/verify', totpController.verify2FA);

router.post('/setup', authenticate, totpController.setup2FA);
router.post('/enable', authenticate, totpController.enable2FA);
router.post('/disable', authenticate, totpController.disable2FA);
router.get('/status', authenticate, totpController.get2FAStatus);

export default router;
