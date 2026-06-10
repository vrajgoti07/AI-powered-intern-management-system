import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

/**
 * Organization Routes
 * 
 * Public:
 *   POST   /register          - Register new organization
 *   GET    /slug/:slug        - Check slug availability
 * 
 * Authenticated:
 *   GET    /me                - Get current organization
 *   PUT    /me                - Update current organization (HR/Admin)
 *   GET    /me/stats          - Get org statistics
 *   GET    /me/plan-limits    - Check plan limits
 * 
 * Super Admin:
 *   GET    /                  - List all organizations
 */

// Public routes
router.post('/register', OrganizationController.register);
router.get('/slug/:slug', OrganizationController.checkSlug);

// Authenticated routes
router.get('/me', authenticate, OrganizationController.getMyOrganization);
router.put('/me', authenticate, authorize('HR', 'SUPER_ADMIN'), OrganizationController.updateMyOrganization);
router.get('/me/stats', authenticate, authorize('HR', 'SUPER_ADMIN'), OrganizationController.getMyOrgStats);
router.get('/me/plan-limits', authenticate, authorize('HR', 'SUPER_ADMIN'), OrganizationController.checkPlanLimits);

// Super Admin routes
router.get('/', authenticate, authorize('SUPER_ADMIN'), OrganizationController.listAll);

export default router;
