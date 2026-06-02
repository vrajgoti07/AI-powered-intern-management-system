import { Router } from 'express';
import multer from 'multer';
import prisma from '../config/database';

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

import * as path from 'path';
import * as fs from 'fs';

// Configure multer for temporary disk storage using local project uploads folder
const localUploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}
const upload = multer({ dest: localUploadsDir });

// Secure all AI routing endpoints under JWT authentication + AI rate limiter
router.use(authenticate);
router.use(aiLimiter);

/**
 * @route   POST /api/ai/parse-resume
 * @desc    Upload a PDF resume and parse it using advanced NLP
 * @access  Authenticated Users
 */
router.post('/parse-resume', upload.single('file'), aiController.parseResume);
router.get('/parse-history', aiController.getParseHistory);

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

// GET /api/ai/feedback/history
router.get('/feedback/history', async (req: any, res: any) => {
  try {
    const internId = req.user?.intern?.id;
    if (!internId) {
      return res.status(404).json({ success: false, message: 'Intern profile not found.' });
    }
    const feedbacks = await prisma.feedback.findMany({
      where: { internId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return res.json({ success: true, data: feedbacks });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/ai/feedback
router.post('/feedback', async (req: any, res: any) => {
  try {
    const internId = req.user?.intern?.id;
    if (!internId) {
      return res.status(403).json({ success: false, message: 'Only interns can submit feedback.' });
    }
    
    // Fetch the intern's assigned mentorId
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
      select: { mentorId: true },
    });
    const mentorId = intern?.mentorId;
    if (!mentorId) {
      return res.status(400).json({ success: false, message: 'No mentor assigned to this intern yet.' });
    }

    const { rating, comment, type } = req.body;
    if (!rating || !comment) {
      return res.status(400).json({ success: false, message: 'Rating and comment are required.' });
    }
    
    const feedback = await prisma.feedback.create({
      data: {
        internId,
        mentorId,
        rating: Number(rating),
        comment,
        category: type || 'GENERAL',
      },
    });
    return res.json({ success: true, data: feedback });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
