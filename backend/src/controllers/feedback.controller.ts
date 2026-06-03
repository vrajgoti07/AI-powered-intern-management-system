import { Request, Response, NextFunction } from 'express';
import feedbackService from '../services/feedback.service';
import { successResponse } from '../utils/response';
import prisma from '../config/database';

export class FeedbackController {
  /**
   * Intern submits self-evaluation log
   */
  async createFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const { rating, comment, category } = req.body;
      const internUserId = req.user!.id; // Authenticated user ID

      const feedback = await feedbackService.createFeedback({
        internUserId,
        rating: Number(rating),
        comment,
        category,
      });

      successResponse(res, 'Self reflection log submitted successfully', feedback);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mentor submits feedback for Intern
   */
  async createMentorFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const { rating, comment, category, internId } = req.body;
      const mentorUserId = req.user!.id;

      if (!internId) {
        res.status(400).json({ success: false, message: "internId is required" });
        return;
      }

      const result = await feedbackService.createMentorFeedback({
        mentorUserId,
        internId,
        rating: Number(rating),
        comment,
        category,
      });

      successResponse(res, 'Mentor feedback submitted successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * HR retrieves raw feedbacks listing
   */
  async getHRFeedbacks(_req: Request, res: Response, next: NextFunction) {
    try {
      const feedbacks = await feedbackService.getHRFeedbacks();
      successResponse(res, 'HR feedbacks retrieved successfully', feedbacks);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch feedback history (scoped based on logged-in role)
   */
  async getFeedbackHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;
      const { internId } = req.query;

      const history = await feedbackService.getFeedbackHistory({
        userId,
        role,
        internId: internId ? String(internId) : undefined
      });

      successResponse(res, 'Feedback history retrieved successfully', history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Fetch action items checklist (scoped based on logged-in role)
   */
  async getActionItems(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const role = req.user!.role;
      const { internId } = req.query;

      const actionItems = await feedbackService.getActionItems({
        userId,
        role,
        internId: internId ? String(internId) : undefined
      });

      successResponse(res, 'Action items checklist retrieved successfully', actionItems);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check off / modify action item status
   */
  async updateActionItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user!.id;
      const role = req.user!.role;

      if (!status) {
        res.status(400).json({ success: false, message: 'status parameter is required' });
        return;
      }

      const updatedItem = await feedbackService.updateActionItem(
        String(id),
        String(status),
        String(userId),
        String(role)
      );

      successResponse(res, 'Action item updated successfully', updatedItem);
    } catch (error) {
      next(error);
    }
  }

  /**
   * HR aggregated analytics insights
   */
  async getHRInsights(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, internId, cycle } = req.query;

      const insights = await feedbackService.getHRInsights({
        departmentId: departmentId ? String(departmentId) : undefined,
        internId: internId ? String(internId) : undefined,
        cycle: cycle ? String(cycle) : undefined
      });

      successResponse(res, 'Feedback insights computed successfully', insights);
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * HR Admin get all feedbacks and action items
   */
  async getHRAllData(req: Request, res: Response, next: NextFunction) {
    try {
      const { departmentId, internId, cycle } = req.query;

      const userRole = req.user!.role;
      const isHRAdmin = ['HR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
      if (!isHRAdmin) {
        res.status(403).json({ success: false, message: 'Forbidden: HR Admin role required' });
        return;
      }

      const data = await feedbackService.getHRDashboardData({
        departmentId: departmentId ? String(departmentId) : undefined,
        internId: internId ? String(internId) : undefined,
        cycle: cycle ? String(cycle) : undefined
      });

      successResponse(res, 'HR admin data retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mentor get evaluation insights, history, and action items
   */
  async getMentorAllData(req: Request, res: Response, next: NextFunction) {
    try {
      const { internId } = req.query;
      const mentorId = String(req.params.mentorId);

      const userRole = req.user!.role;
      const isHRAdmin = ['HR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
      const isMentor = ['MENTOR', 'DEPARTMENT_HEAD'].includes(userRole);

      if (!isHRAdmin && !isMentor) {
        res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
        return;
      }

      // If mentor, verify they are requesting their own ID
      if (isMentor && !isHRAdmin) {
        const mentor = await prisma.mentor.findUnique({
          where: { userId: req.user!.id }
        });
        if (!mentor || (mentor.id !== mentorId && mentor.userId !== mentorId)) {
          res.status(403).json({ success: false, message: 'Forbidden: You can only view your own mentor dashboard' });
          return;
        }
      }

      const data = await feedbackService.getMentorDashboardData({
        mentorUserId: req.user!.id,
        internId: internId ? String(internId) : undefined
      });

      successResponse(res, 'Mentor dashboard data retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Intern get own insights, history, and action items
   */
  async getInternAllData(req: Request, res: Response, next: NextFunction) {
    try {
      const internId = String(req.params.internId);

      let intern = await prisma.intern.findUnique({
        where: { id: internId }
      });

      if (!intern) {
        intern = await prisma.intern.findUnique({
          where: { userId: internId }
        });
      }

      if (!intern) {
        res.status(404).json({ success: false, message: 'Intern profile not found' });
        return;
      }

      const userRole = req.user!.role;
      const isHRAdmin = ['HR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);

      if (intern.userId !== req.user!.id && !isHRAdmin) {
        res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
        return;
      }

      const data = await feedbackService.getInternDashboardData({
        internUserId: intern.userId
      });

      successResponse(res, 'Intern dashboard data retrieved successfully', data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Seed realistic feedback and action items data
   */
  async seedFeedbackData(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await feedbackService.seedDemoFeedbackData();
      successResponse(res, 'Database feedback demo data seeded successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

export default new FeedbackController();
