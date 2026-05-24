import { Request, Response, NextFunction } from 'express';
import aiService from '../services/ai.service';
import { successResponse } from '../utils/response';
import prisma from '../config/database';
import { logger } from '../utils/logger';

export class AIController {
  /**
   * Match an intern profile to department and role requirements
   */
  async matchRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { skills, interests, education, departmentRequirements } = req.body;
      
      const result = await aiService.matchRole({
        skills,
        interests,
        education,
        departmentRequirements,
      });

      successResponse(res, 'Role matching analysis completed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Predict an intern's performance grade, score, risk, and factors
   */
  async predictPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { attendanceRate, taskCompletionRate, feedbackSentimentScore, productivityScore } = req.body;

      const result = await aiService.predictPerformance({
        attendanceRate,
        taskCompletionRate,
        feedbackSentimentScore,
        productivityScore,
      });

      successResponse(res, 'Performance prediction analysis completed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Perform sentiment analysis on feedback comments and extract suggestions
   */
  async sentimentAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { feedbackText } = req.body;

      const result = await aiService.analyzeSentiment({
        feedbackText,
      });

      successResponse(res, 'Feedback sentiment analysis completed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Query the AI chatbot for semantic FAQ answers and context recommendations.
   * 
   * Enriches the context with real database data for the logged-in user:
   * - INTERN: attendance, score, tasks, mentor name, department, skills, status
   * - MENTOR: assigned interns (with scores/attendance), department, expertise
   */
  async chatbot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, history, context } = req.body;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      // Start with frontend-supplied context, then enrich with DB data
      const enrichedContext: Record<string, any> = {
        user_name: req.user?.name,
        user_role: userRole,
        ...(context || {}),
      };

      // ── Enrich context from database based on role ──────────────
      try {
        if (userRole === 'INTERN' && userId) {
          await this._enrichInternContext(userId, enrichedContext);
        } else if (userRole === 'MENTOR' && userId) {
          await this._enrichMentorContext(userId, enrichedContext);
        }
      } catch (enrichErr) {
        // Non-critical: if enrichment fails, we still proceed with partial context
        logger.warn('Context enrichment failed (non-critical):', enrichErr);
      }

      const result = await aiService.chatbot({
        message,
        history,
        context: enrichedContext,
        sessionId: userId,
      });

      successResponse(res, 'Chatbot dialog sequence completed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enrich context with real intern data from the database.
   */
  private async _enrichInternContext(userId: string, ctx: Record<string, any>): Promise<void> {
    const intern = await prisma.intern.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true } },
        department: { select: { name: true } },
        mentor: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
        tasks: {
          where: { status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] } },
          orderBy: { dueDate: 'asc' },
          take: 10,
          select: {
            title: true,
            status: true,
            dueDate: true,
            priority: true,
          },
        },
      },
    });

    if (!intern) return;

    // Only set values if they aren't already provided by the frontend
    // (DB values serve as authoritative fallback)
    ctx.intern_id = ctx.intern_id || intern.id;
    ctx.attendance = ctx.attendance ?? intern.attendance;
    ctx.score = ctx.score ?? intern.score;
    ctx.status = ctx.status || intern.status;
    ctx.skills = (ctx.skills && ctx.skills.length > 0) ? ctx.skills : intern.skills;
    ctx.department = ctx.department || intern.department?.name || '';
    ctx.mentor_name = (ctx.mentor_name && ctx.mentor_name !== 'Not assigned' && ctx.mentor_name !== 'Your Mentor')
      ? ctx.mentor_name
      : (intern.mentor?.user?.name || 'Not assigned yet');

    // Always use fresh task data from DB if frontend didn't send any
    if (!ctx.tasks || !Array.isArray(ctx.tasks) || ctx.tasks.length === 0) {
      ctx.tasks = intern.tasks.map((t: any) => ({
        title: t.title,
        status: t.status,
        dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No deadline',
        priority: t.priority,
      }));
    }
  }

  /**
   * Enrich context with real mentor data from the database.
   */
  private async _enrichMentorContext(userId: string, ctx: Record<string, any>): Promise<void> {
    const mentor = await prisma.mentor.findUnique({
      where: { userId },
      include: {
        user: { select: { name: true } },
        department: { select: { name: true } },
        interns: {
          include: {
            user: { select: { name: true } },
          },
          take: 15,
        },
      },
    });

    if (!mentor) return;

    ctx.department = ctx.department || mentor.department?.name || '';
    ctx.skills = (ctx.skills && ctx.skills.length > 0) ? ctx.skills : mentor.expertise;
    ctx.intern_count = mentor.interns.length;
    ctx.interns = mentor.interns.map((intern: any) => ({
      name: intern.user?.name || 'Unknown',
      score: intern.score,
      attendance: intern.attendance,
      status: intern.status,
    }));
  }
}

export default new AIController();
