import { Request, Response, NextFunction } from 'express';
import goalService from '../services/goal.service';
import { successResponse } from '../utils/response';

/**
 * POST /api/goals
 * Create a new goal for the logged-in intern.
 */
export const createGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intern = req.user?.intern;
    if (!intern) {
      res.status(400).json({ success: false, message: 'Only interns can create goals.' });
      return;
    }

    const { title, description } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      res.status(400).json({ success: false, message: 'Goal title is required and must be at least 5 characters.' });
      return;
    }

    if (title.length > 500) {
      res.status(400).json({ success: false, message: 'Goal title must be 500 characters or less.' });
      return;
    }

    const result = await goalService.createGoal(intern.id, title.trim(), description?.trim());
    successResponse(res, 'Goal created with AI-generated tasks', result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/goals/my
 * Get all goals for the logged-in intern.
 */
export const getMyGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intern = req.user?.intern;
    if (!intern) {
      res.status(400).json({ success: false, message: 'Only interns can view their goals.' });
      return;
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    const result = await goalService.getGoalsForIntern(intern.id, page, limit);
    successResponse(res, 'Goals fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/goals/stats
 * Get goal statistics for the logged-in intern.
 */
export const getMyGoalStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const intern = req.user?.intern;
    if (!intern) {
      res.status(400).json({ success: false, message: 'Only interns can view their goal stats.' });
      return;
    }

    const stats = await goalService.getGoalStats(intern.id);
    successResponse(res, 'Goal stats fetched successfully', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/goals/intern/:internId
 * Get goals for a specific intern (mentor/HR view).
 */
export const getInternGoals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { internId } = req.params;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));

    const result = await goalService.getGoalsForIntern(internId as string, page, limit);
    successResponse(res, 'Intern goals fetched successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/goals/:goalId
 * Get a single goal with full details.
 */
export const getGoalById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goal = await goalService.getGoalById(req.params.goalId as string);
    successResponse(res, 'Goal fetched successfully', goal);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/goals/:goalId
 * Delete a goal (intern-owner or HR/SUPER_ADMIN only).
 */
export const deleteGoal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await goalService.deleteGoal(req.params.goalId as string, req.user!.id);
    successResponse(res, 'Goal deleted successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/goals/evaluate
 * Manually trigger goal evaluation (HR/SUPER_ADMIN only).
 */
export const triggerEvaluation = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await goalService.evaluateWeeklyGoals();
    successResponse(res, 'Goal evaluation completed', result);
  } catch (error) {
    next(error);
  }
};
