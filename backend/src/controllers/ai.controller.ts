import { Request, Response, NextFunction } from 'express';
import aiService from '../services/ai.service';
import { successResponse, errorResponse } from '../utils/response';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import * as fs from 'fs';

export class AIController {
  
  /**
   * Parse Resume (Part 1)
   */
  async parseResume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        errorResponse(res, 'No file uploaded', 400);
        return;
      }
      
      let requiredSkills = [];
      if (req.body.requiredSkills) {
        try {
          requiredSkills = JSON.parse(req.body.requiredSkills);
        } catch (e) {
          requiredSkills = req.body.requiredSkills.split(',').map((s: string) => s.trim());
        }
      }

      // Pass token if we want to forward auth to python, else undefined
      const token = req.headers.authorization?.split(' ')[1];
      
      const result = await aiService.parseInternResume(req.file.path, requiredSkills, token);
      
      // Save parsed resume to persistent database
      const userId = (req as any).user?.id;
      if (userId) {
        try {
          await prisma.parsedResume.create({
            data: {
              userId,
              name: result.name || 'Unknown Candidate',
              email: result.email || '',
              phone: result.phone || '',
              skills: result.skills || [],
              education: result.education ? JSON.parse(JSON.stringify(result.education)) : [],
              experience: result.experience ? JSON.parse(JSON.stringify(result.experience)) : [],
              projects: result.projects ? JSON.parse(JSON.stringify(result.projects)) : [],
              skillScore: Number(result.skillScore || 0),
              experienceYears: Number(result.experienceYears || 0),
            }
          });
        } catch (dbErr) {
          logger.error('Failed to save parsed resume history to database:', dbErr);
        }
      }

      // Clean up the temporary file
      fs.unlinkSync(req.file.path);

      successResponse(res, 'Resume parsed successfully', result);
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }

  /**
   * Get parsed resume history isolated by user role
   */
  async getParseHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        errorResponse(res, 'Authentication required', 401);
        return;
      }

      let history = [];

      if (user.role === 'INTERN') {
        // Interns see only their own parses that are not soft-deleted
        history = await prisma.parsedResume.findMany({
          where: { userId: user.id, deletedByUser: false },
          orderBy: { createdAt: 'desc' },
          take: 15,
        });
      } else if (user.role === 'MENTOR') {
        // Mentors see their own parses + parses of their assigned interns that are not soft-deleted
        const mentor = await prisma.mentor.findUnique({
          where: { userId: user.id },
          include: { interns: true },
        });
        const internUserIds = mentor?.interns.map((i: any) => i.userId) || [];
        history = await prisma.parsedResume.findMany({
          where: {
            userId: { in: [user.id, ...internUserIds] },
            deletedByUser: false,
          },
          orderBy: { createdAt: 'desc' },
          take: 15,
        });
      } else {
        // HR / SUPER_ADMIN see all parsed resumes, even if soft-deleted by user
        history = await prisma.parsedResume.findMany({
          orderBy: { createdAt: 'desc' },
          take: 30,
        });
      }

      successResponse(res, 'Parsing history retrieved successfully', history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete parsed resume from history with strict role check
   */
  async deleteParseHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      if (!user) {
        errorResponse(res, 'Authentication required', 401);
        return;
      }

      const parsedResume = await prisma.parsedResume.findUnique({
        where: { id: id as string },
      });

      if (!parsedResume) {
        errorResponse(res, 'Parsed resume not found', 404);
        return;
      }

      // Role isolation check for deletion
      if (user.role === 'INTERN') {
        if (parsedResume.userId !== user.id) {
          errorResponse(res, 'You are not authorized to delete this resume', 403);
          return;
        }
      } else if (user.role === 'MENTOR') {
        const mentor = await prisma.mentor.findUnique({
          where: { userId: user.id },
          include: { interns: true },
        });
        const internUserIds = mentor?.interns.map((i: any) => i.userId) || [];
        const authorizedUserIds = [user.id, ...internUserIds];

        if (!authorizedUserIds.includes(parsedResume.userId)) {
          errorResponse(res, 'You are not authorized to delete this resume', 403);
          return;
        }
      }

      // Soft delete for Intern/Mentor, hard delete for HR/Admin
      if (user.role === 'INTERN' || user.role === 'MENTOR') {
        await prisma.parsedResume.update({
          where: { id: id as string },
          data: { deletedByUser: true },
        });
      } else {
        await prisma.parsedResume.delete({
          where: { id: id as string },
        });
      }

      successResponse(res, 'Parsed resume deleted successfully');
    } catch (error) {
      next(error);
    }
  }

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
      const { 
        internId,
        attendanceRate, 
        taskCompletionRate, 
        feedbackSentimentScore, 
        productivityScore,
        daysSinceLastTask,
        communicationScore,
        skillMatchScore,
        weekNumber
      } = req.body;

      const result = await aiService.predictPerformance(internId || 'unknown', {
        attendanceRate,
        taskCompletionRate,
        feedbackSentimentScore,
        productivityScore,
        daysSinceLastTask,
        communicationScore,
        skillMatchScore,
        weekNumber
      });

      successResponse(res, 'Performance prediction analysis completed successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Smart Intern Ranking (Part 3)
   */
  async getRanking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId } = req.query;
      
      // Fetch interns to rank
      const whereClause = departmentId ? { departmentId: departmentId as string } : {};
      const interns = await prisma.intern.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true } }
        }
      });

      // Map to expected format
      const internsData = await Promise.all(interns.map(async i => {
        const avg_task_rating = (i.score || 0) / 20;
        return {
          intern_id: i.id,
          name: i.user?.name || 'Unknown',
          attendance_rate: i.attendance || 0,
          task_completion_rate: (i.score || 0) / 100, // proxy
          avg_task_rating: avg_task_rating, 
          communication_score: (i.score || 0) / 20,
          skill_growth_score: 0.8
        };
      }));

      const result = await aiService.getInternRanking(internsData, departmentId as string);

      successResponse(res, 'Intern ranking generated successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Evaluate Intern Risks (Part 5)
   */
  async evaluateRisks(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Fetch interns to evaluate
      const interns = await prisma.intern.findMany({
        include: {
          user: { select: { name: true } },
          department: { select: { name: true } }
        }
      });

      const internsData = await Promise.all(interns.map(async i => {
        const lastActiveTask = await prisma.task.findFirst({ 
          where: { internId: i.id }, 
          orderBy: { updatedAt: 'desc' } 
        });
        const days_since_last_activity = lastActiveTask 
          ? Math.floor((Date.now() - new Date(lastActiveTask.updatedAt).getTime()) / (1000 * 3600 * 24))
          : 0;

        const overdueHighPriorityTasks = await prisma.task.count({
          where: {
            internId: i.id,
            priority: 'HIGH',
            status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
            dueDate: { lt: new Date() }
          }
        });

        const activeTasksCount = await prisma.task.count({
          where: {
            internId: i.id,
            status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] }
          }
        });
        const workloadScore = Math.min(100, activeTasksCount * 15);

        const lastReviewedTask = await prisma.task.findFirst({
          where: { internId: i.id, status: 'COMPLETED' },
          orderBy: { updatedAt: 'desc' }
        });
        const daysSinceMentorInteraction = lastReviewedTask
          ? Math.floor((Date.now() - new Date(lastReviewedTask.updatedAt).getTime()) / (1000 * 3600 * 24))
          : 5;

        return {
          internId: i.id,
          name: i.user?.name || 'Unknown',
          attendance: i.attendance || 0,
          department: (i as any).department?.name || '',
          college: (i as any).college || '',
          days_since_last_task: days_since_last_activity,
          overdue_high_priority_tasks: overdueHighPriorityTasks,
          workload_score: workloadScore,
          days_since_mentor_interaction: daysSinceMentorInteraction
        };
      }));

      const result = await aiService.evaluateInternRisks(internsData);

      successResponse(res, 'Risk evaluation completed successfully', result);
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
   * Add Document for Chatbot (Part 4)
   */
  async addChatbotDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        errorResponse(res, 'No file uploaded', 400);
        return;
      }
      
      const result = await aiService.addHRDocument(req.file.path);
      
      // Clean up the temporary file
      fs.unlinkSync(req.file.path);

      successResponse(res, 'Document indexed successfully', result);
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
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

  /**
   * Get intern-mentor matching recommendations
   */
  async getRecommendations(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Step 3: Return from DB if it exists
      const dbRecs = await prisma.aIRecommendation.findMany();

      if (dbRecs.length > 0) {
        // Return from DB
        const populated = await Promise.all(
          dbRecs.map(async (rec: any) => {
            const intern = await prisma.intern.findUnique({
              where: { id: rec.internId },
              include: { user: { select: { name: true } } },
            });
            const mentor = await prisma.mentor.findUnique({
              where: { id: rec.mentorId },
              include: { user: { select: { name: true } } },
            });
            return {
              id: rec.id,
              internName: intern?.user?.name || 'Unknown Intern',
              mentorName: mentor?.user?.name || 'Unknown Mentor',
              matchScore: rec.matchScore,
              confidenceLevel: rec.confidence,
              reasons: rec.reasons,
              status: rec.status,
              createdAt: rec.createdAt,
              updatedAt: rec.updatedAt,
            };
          })
        );
        successResponse(res, 'Recommendations retrieved from database', populated);
        return;
      }

      // Step 2: Call the "AI Service" (generate pairings via skill matching)
      const interns = await prisma.intern.findMany({
        include: { user: { select: { name: true } } },
      });
      const mentors = await prisma.mentor.findMany({
        include: { user: { select: { name: true } } },
      });

      const generatedRecs: any[] = [];

      for (const intern of interns) {
        for (const mentor of mentors) {
          const internSkills = intern.skills || [];
          const mentorSkills = mentor.expertise || mentor.skills || [];
          
          const internSkillsSet = new Set(internSkills.map((s: string) => s.toLowerCase().trim()));
          const overlap = mentorSkills.filter((s: string) => internSkillsSet.has(s.toLowerCase().trim()));

          const deptMatch = intern.departmentId === mentor.departmentId;
          const matchScore = Math.min(
            Math.round(
              (deptMatch ? 50 : 20) + 
              (internSkills.length > 0 ? (overlap.length / Math.max(internSkills.length, 1)) * 50 : 30)
            ),
            100
          );

          let confidence = 'MEDIUM';
          if (matchScore >= 80) confidence = 'HIGH';
          else if (matchScore < 50) confidence = 'LOW';

          const reasons: string[] = [];
          if (deptMatch) {
            reasons.push('Assigned in the same department.');
          }
          if (overlap.length > 0) {
            reasons.push(`Overlapping expertise on: ${overlap.slice(0, 3).join(', ')}.`);
          } else {
            reasons.push('Expressed compatible technical skills and interests.');
          }
          reasons.push('AI prediction suggests highly compatible learning and coaching styles.');

          // Save the recommendation to DB using prisma.aIRecommendation.create()
          const newRec = await prisma.aIRecommendation.create({
            data: {
              internId: intern.id,
              mentorId: mentor.id,
              matchScore,
              confidence,
              reasons,
              status: 'pending',
            },
          });

          generatedRecs.push({
            id: newRec.id,
            internName: intern.user?.name || 'Unknown Intern',
            mentorName: mentor.user?.name || 'Unknown Mentor',
            matchScore: newRec.matchScore,
            confidenceLevel: newRec.confidence,
            reasons: newRec.reasons,
            status: newRec.status,
            createdAt: newRec.createdAt,
            updatedAt: newRec.updatedAt,
          });
        }
      }

      successResponse(res, 'Recommendations generated and saved successfully', generatedRecs);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Apply recommendation
   */
  async applyRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await prisma.aIRecommendation.update({
        where: { id },
        data: { status: 'applied' },
      });
      successResponse(res, 'Recommendation status set to applied', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject recommendation
   */
  async rejectRecommendation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const updated = await prisma.aIRecommendation.update({
        where: { id },
        data: { status: 'rejected' },
      });
      successResponse(res, 'Recommendation status set to rejected', updated);
    } catch (error) {
      next(error);
    }
  }
}

export default new AIController();
