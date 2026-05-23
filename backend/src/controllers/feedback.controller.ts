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
