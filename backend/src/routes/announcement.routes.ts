import { Router } from 'express';
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcement.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Protect all announcement routes (require login)
router.use(authenticate);

// GET /api/announcements - Get announcements for current user
router.route('/')
  .get(getAnnouncements);

// POST /api/announcements - Create a new announcement (HR and SUPER_ADMIN only)
router.route('/')
  .post(authorize('HR', 'SUPER_ADMIN'), createAnnouncement);

// DELETE /api/announcements/:id - Delete an announcement (HR and SUPER_ADMIN only)
router.route('/:id')
  .delete(authorize('HR', 'SUPER_ADMIN'), deleteAnnouncement);

export default router;
