import { Request, Response, NextFunction } from 'express';
import feedbackService from '../services/feedback.service';
import { successResponse } from '../utils/response';

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
