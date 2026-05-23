import { Request, Response, NextFunction } from 'express';
import aiService from '../services/ai.service';
import { successResponse } from '../utils/response';

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
   * Query the AI chatbot for semantic FAQ answers and context recommendations
   */
  async chatbot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, history, context } = req.body;

      // Automatically inject user contextual profile if not explicitly supplied
      const enrichedContext = {
        user_name: req.user?.name,
        user_role: req.user?.role,
        ...(context || {}),
      };

      const result = await aiService.chatbot({
        message,
        history,
        context: enrichedContext,
      });

      successResponse(res, 'Chatbot dialog sequence completed successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AIController();
