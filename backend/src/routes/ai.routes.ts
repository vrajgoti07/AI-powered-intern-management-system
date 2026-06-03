import { Router } from 'express';
import multer from 'multer';
import prisma from '../config/database';

import aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
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
router.delete('/parse-history/:id', aiController.deleteParseHistory);

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

/**
 * POST /api/v1/ai/risks/intervene
 * HR triggers a manual intervention for a high-risk intern.
 * - Creates an in-app notification for the intern's assigned mentor
 * - Sends an email to the mentor (triggerEmail: true via notificationService)
 * - Sends a confirmation email to the HR user who triggered it
 * - Logs the action to AuditLog
 */
router.post('/risks/intervene', authorize('HR', 'SUPER_ADMIN'), async (req: any, res: any) => {
  try {
    const { internId, internName, riskLevel, notes, department } = req.body;
    if (!internId || !notes) {
      return res.status(400).json({ success: false, message: 'internId and notes are required.' });
    }

    // 1. Find the intern with mentor and user details
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        mentor: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!intern) {
      return res.status(404).json({ success: false, message: 'Intern not found.' });
    }

    const hrUser = req.user;
    const mentorUser = intern.mentor?.user;
    const internUser = intern.user;
    const resolvedInternName = internUser?.name || internName || 'Unknown Intern';
    const resolvedDept = department || 'N/A';
    const resolvedRiskLevel = riskLevel || 'HIGH';

    // 2. Notify the mentor (in-app + email) if mentor is assigned
    if (mentorUser?.id) {
      const notificationService = (await import('../services/notification.service')).default;
      await notificationService.createNotification(
        mentorUser.id,
        `Intervention Required: ${resolvedInternName}`,
        `HR has flagged ${resolvedInternName} (${resolvedDept}) as ${resolvedRiskLevel} risk. Intervention notes: "${notes}". Please schedule a 1-on-1 review.`,
        'INTERVENTION_ALERT',
        { internId, riskLevel: resolvedRiskLevel, department: resolvedDept },
        true, // triggerEmail = true → sends email to mentor
        `[InternFlow] Intervention Alert — ${resolvedInternName} (${resolvedRiskLevel} Risk)`
      );
    }

    // 3. Send confirmation email to the HR user who triggered it
    const { emailQueue } = await import('../queues/queue.config');
    if (hrUser?.email) {
      const hrEmailHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
          <div style="border-bottom:2px solid #f1f5f9;padding-bottom:20px;margin-bottom:20px;">
            <div style="font-size:20px;font-weight:800;color:#4f46e5;">InternFlow</div>
            <h2 style="color:#0f172a;margin:12px 0 0;font-size:17px;font-weight:700;">Intervention Dispatched</h2>
          </div>
          <p style="font-size:14px;color:#334155;margin:0 0 16px;">Your intervention request has been logged and the mentor has been notified.</p>
          <table style="width:100%;font-size:13px;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#64748b;font-weight:600;width:140px;">Intern</td><td style="padding:8px 0;color:#0f172a;font-weight:700;">${resolvedInternName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Department</td><td style="padding:8px 0;color:#0f172a;font-weight:700;">${resolvedDept}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Risk Level</td><td style="padding:8px 0;color:#dc2626;font-weight:700;">${resolvedRiskLevel}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Mentor Notified</td><td style="padding:8px 0;color:#0f172a;font-weight:700;">${mentorUser?.name || 'No mentor assigned'}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Your Notes</td><td style="padding:8px 0;color:#0f172a;font-weight:700;">${notes}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;font-weight:600;">Triggered At</td><td style="padding:8px 0;color:#0f172a;font-weight:700;">${new Date().toLocaleString()}</td></tr>
          </table>
          <div style="margin-top:24px;padding:14px;background:#f8fafc;border-radius:8px;font-size:12px;color:#94a3b8;">This is an automated confirmation from InternFlow. Do not reply to this email.</div>
        </div>
      `;
      await emailQueue.add('send_email', {
        to: hrUser.email,
        subject: `[InternFlow] Intervention Confirmed — ${resolvedInternName}`,
        html: hrEmailHtml
      });
    }

    // 4. Audit log
    await prisma.auditLog.create({
      data: {
        userId: hrUser?.id,
        action: 'INTERVENTION_TRIGGERED',
        entity: 'Intern',
        entityId: internId,
        metadata: { internName: resolvedInternName, riskLevel: resolvedRiskLevel, department: resolvedDept, notes },
        ipAddress: req.ip || 'unknown'
      }
    });

    return res.json({
      success: true,
      message: `Intervention dispatched. ${mentorUser ? `Mentor ${mentorUser.name} has been notified by email.` : 'No mentor assigned — intern has no mentor yet.'}`,
      data: {
        mentorNotified: !!mentorUser,
        mentorName: mentorUser?.name || null,
        mentorEmail: mentorUser?.email || null
      }
    });

  } catch (error: any) {
    console.error('Intervention dispatch error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
