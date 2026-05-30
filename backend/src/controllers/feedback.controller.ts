import { Request, Response, NextFunction } from 'express';
import feedbackService from '../services/feedback.service';
import { successResponse } from '../utils/response';

export class FeedbackController {
  async createFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const { rating, comment, category } = req.body;
      const internUserId = req.user!.id; // Authenticated user ID

      const feedback = await feedbackService.createFeedback({
        internUserId,
        rating,
        comment,
        category,
      });

      successResponse(res, 'Feedback submitted successfully', feedback);
    } catch (error) {
      next(error);
    }
  }

  async createMentorFeedback(req: Request, res: Response, next: NextFunction) {
    try {
      const { rating, comment, category, internId } = req.body;

      if (!internId) {
        res.status(400).json({ success: false, message: "internId is required" });
        return;
      }

      const feedback = await feedbackService.createFeedback({
        internUserId: internId, // Reusing field name although it's targeted for intern
        rating,
        comment,
        category,
      });

      successResponse(res, 'Mentor feedback submitted successfully', feedback);
    } catch (error) {
      next(error);
    }
  }

  async getHRFeedbacks(_req: Request, res: Response, next: NextFunction) {
    try {
      const feedbacks = await feedbackService.getHRFeedbacks();
      successResponse(res, 'HR feedbacks retrieved successfully', feedbacks);
    } catch (error) {
      next(error);
    }
  }
}

export default new FeedbackController();
