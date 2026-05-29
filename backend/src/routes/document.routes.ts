import { Router } from 'express';
import {
  generateCertificate,
  generateOfferLetter,
  generatePerformanceReport,
  getInternDocuments,
  downloadDocument
} from '../controllers/document.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Routes
router.post('/certificate/:internId', authenticate, authorize('SUPER_ADMIN', 'HR'), generateCertificate);
router.post('/offer-letter/:internId', authenticate, authorize('SUPER_ADMIN', 'HR'), generateOfferLetter);
router.post('/performance-report/:internId', authenticate, authorize('SUPER_ADMIN', 'HR', 'MENTOR'), generatePerformanceReport);
router.get('/:internId', authenticate, getInternDocuments);
router.get('/download/:documentId', authenticate, downloadDocument);

export default router;
