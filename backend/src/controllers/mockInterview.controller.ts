import { Request, Response, NextFunction } from 'express';
import mockInterviewService from '../services/mockInterview.service';
import { successResponse } from '../utils/response';

/**
 * POST /api/mock-interviews/start
 * Initiate a new mock interview session for the logged-in intern.
 */
export const startInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intern = req.user?.intern;
    if (!intern) {
      res.status(400).json({ success: false, message: 'Only interns can participate in mock interviews.' });
      return;
    }

    const { jobRole } = req.body;
    if (!jobRole || typeof jobRole !== 'string' || jobRole.trim().length < 2) {
      res.status(400).json({ success: false, message: 'Job role is required.' });
      return;
    }

    const result = await mockInterviewService.startInterview(intern.id, jobRole.trim());
    successResponse(res, 'Mock interview session generated successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mock-interviews/:id/answer
 * Submit an answer for a specific question number in the active interview session.
 */
export const submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intern = req.user?.intern;
    if (!intern) {
      res.status(400).json({ success: false, message: 'Only interns can submit answers.' });
      return;
    }

    const interviewId = req.params.id as string;
    const { questionNumber, answer } = req.body;

    if (!questionNumber || typeof questionNumber !== 'number') {
      res.status(400).json({ success: false, message: 'Valid question number is required.' });
      return;
    }

    if (!answer || typeof answer !== 'string') {
      res.status(400).json({ success: false, message: 'Answer string is required.' });
      return;
    }

    const result = await mockInterviewService.submitAnswer(
      intern.id,
      interviewId,
      questionNumber,
      answer
    );
    successResponse(res, 'Question answer evaluated and updated successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/mock-interviews/:id/complete
 * Complete the mock interview session and generate the final readiness summary.
 */
export const completeInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intern = req.user?.intern;
    if (!intern) {
      res.status(400).json({ success: false, message: 'Only interns can complete interviews.' });
      return;
    }

    const interviewId = req.params.id as string;
    const result = await mockInterviewService.completeInterview(intern.id, interviewId);
    successResponse(res, 'Mock interview session completed with evaluation score and feedback', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mock-interviews/my
 * Get all mock interview history for the logged-in intern.
 */
export const getMyInterviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intern = req.user?.intern;
    if (!intern) {
      res.status(400).json({ success: false, message: 'Only interns can fetch their interview history.' });
      return;
    }

    const result = await mockInterviewService.getMyInterviews(intern.id);
    successResponse(res, 'Mock interviews fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/mock-interviews/analytics
 * Get aggregate statistics and department readiness breakdown for HR/Mentors/Admin.
 */
export const getOrganizationAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = req.user?.organizationId;
    if (!orgId) {
      res.status(400).json({ success: false, message: 'User must belong to a tenant organization.' });
      return;
    }

    const result = await mockInterviewService.getOrganizationAnalytics(orgId);
    successResponse(res, 'Mock interview analytics reports fetched successfully', result);
  } catch (error) {
    next(error);
  }
};
