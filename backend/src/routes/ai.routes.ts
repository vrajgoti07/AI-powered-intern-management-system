import { Router } from 'express';
import multer from 'multer';
import * as os from 'os';

import aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';
import {
  matchRoleSchema,
  predictPerformanceSchema,
  sentimentAnalysisSchema,
  chatbotSchema,
} from '../validations/ai.validation';

const router = Router();

// Configure multer for temporary disk storage for forwarding files to the Python microservice
const upload = multer({ dest: os.tmpdir() });

// Secure all AI routing endpoints under JWT authentication + AI rate limiter
router.use(authenticate);
router.use(aiLimiter);

/**
 * @route   POST /api/ai/parse-resume
 * @desc    Upload a PDF resume and parse it using advanced NLP
 * @access  Authenticated Users
 */
router.post('/parse-resume', upload.single('file'), aiController.parseResume);

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
 * @route   GET /api/ai/ranking
 * @desc    Get a smart ranking of interns based on multiple normalized metrics
 * @access  Authenticated Users (HR, Admin)
 */
router.get('/ranking', aiController.getRanking);

/**
 * @route   GET /api/ai/risks
 * @desc    Evaluate potential risks (e.g., dropout, burnout) across all interns
 * @access  Authenticated Users (HR, Admin)
 */
router.get('/risks', aiController.evaluateRisks);

/**
 * @route   POST /api/ai/sentiment-analysis
 * @desc    Run sentiment evaluation and suggestions extraction on feedback text
 * @access  Authenticated Users
 */
router.post('/sentiment-analysis', validate(sentimentAnalysisSchema), aiController.sentimentAnalysis);

/**
 * @route   POST /api/ai/chatbot/add-document
 * @desc    Upload a document (e.g. PDF) to the HR assistant knowledge base
 * @access  Authenticated Users (HR, Admin)
 */
router.post('/chatbot/add-document', upload.single('file'), aiController.addChatbotDocument);

/**
 * @route   POST /api/ai/chatbot
 * @desc    Conversational AI chatbot responding to system FAQ questions (RAG)
 * @access  Authenticated Users
 */
router.post('/chatbot', validate(chatbotSchema), aiController.chatbot);

/**
 * @route   GET /api/ai/recommendations
 * @desc    Get intern-mentor matching recommendations
 * @access  Authenticated Users (HR, Admin)
 */
router.get('/recommendations', aiController.getRecommendations);

/**
 * @route   PATCH /api/ai/recommendations/:id/apply
 * @desc    Apply matching recommendation
 * @access  Authenticated Users (HR, Admin)
 */
router.patch('/recommendations/:id/apply', aiController.applyRecommendation);

/**
 * @route   PATCH /api/ai/recommendations/:id/reject
 * @desc    Reject matching recommendation
 * @access  Authenticated Users (HR, Admin)
 */
router.patch('/recommendations/:id/reject', aiController.rejectRecommendation);

export default router;
