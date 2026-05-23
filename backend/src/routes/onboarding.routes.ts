import express from 'express';
import * as onboardingController from '../controllers/onboarding.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = express.Router();

router.use(authenticate);
router.use(authorize('INTERN'));

router.get('/status', onboardingController.getStatus);
router.post('/offer', onboardingController.submitOffer);
router.post('/personal-info', onboardingController.submitPersonalInfo);
router.post('/education', onboardingController.submitEducation);
router.post('/emergency', onboardingController.submitEmergency);
router.post('/upload-documents', onboardingController.submitDocuments);
router.post('/agreement', onboardingController.submitAgreement);
router.post('/final-submit', onboardingController.submitFinal);

export default router;
