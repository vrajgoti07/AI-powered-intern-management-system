import { Router } from 'express';
import aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  matchRoleSchema,
  predictPerformanceSchema,
  sentimentAnalysisSchema,
  chatbotSchema,
} from '../validations/ai.validation';

const router = Router();

// Secure all AI routing endpoints under JWT authentication
router.use(authenticate);

/**
 * @route   POST /api/ai/match-role
 * @desc    Analyze profile skills, education, and interests to match departmental needs
 * @access  Authenticated Users
 */
router.post('/match-role', validate(matchRoleSchema), aiController.matchRole);

/**
 * @route   POST /api/ai/predict-performance
 * @desc    Predict an intern's final performance rating and driver parameters
 * @access  Authenticated Users (Mentors, HR, Admin)
 */
router.post('/predict-performance', validate(predictPerformanceSchema), aiController.predictPerformance);

/**
 * @route   POST /api/ai/sentiment-analysis
 * @desc    Run sentiment evaluation and suggestions extraction on feedback text
 * @access  Authenticated Users
 */
router.post('/sentiment-analysis', validate(sentimentAnalysisSchema), aiController.sentimentAnalysis);

/**
 * @route   POST /api/ai/chatbot
 * @desc    Conversational AI chatbot responding to system FAQ questions
 * @access  Authenticated Users
 */
router.post('/chatbot', validate(chatbotSchema), aiController.chatbot);

export default router;
