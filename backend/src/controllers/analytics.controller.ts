import { Request, Response, NextFunction } from 'express';
import analyticsService from '../services/analytics.service';
import { successResponse } from '../utils/response';

export class AnalyticsController {
  /**
   * Get role-specific dashboard statistics
   * @route GET /api/v1/analytics/dashboard
   */
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await analyticsService.getDashboardStats(req.user);
      successResponse(res, 'Dashboard statistics retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get intern analytics (attendance rates, task velocity, CGPA spreads, top performers)
   * @route GET /api/v1/analytics/interns
   */
  async getInternAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        departmentId: req.query.departmentId as string | undefined,
      };

      const result = await analyticsService.getInternAnalytics(filter);
      successResponse(res, 'Intern analytics retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get mentor analytics (evaluation counts, ratings, review speeds)
   * @route GET /api/v1/analytics/mentors
   */
  async getMentorAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = {
        departmentId: req.query.departmentId as string | undefined,
      };

      const result = await analyticsService.getMentorAnalytics(filter);
      successResponse(res, 'Mentor analytics retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department analytics (headcounts, averages, CGPA, task stats)
   * @route GET /api/v1/analytics/departments
   */
  async getDepartmentAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = {
        departmentId: req.query.departmentId as string | undefined,
      };

      const result = await analyticsService.getDepartmentAnalytics(filter);
      successResponse(res, 'Department analytics retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get task analytics (status, priority distributions, overdue counts)
   * @route GET /api/v1/analytics/tasks
   */
  async getTaskAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        internId: req.query.internId as string | undefined,
        mentorId: req.query.mentorId as string | undefined,
      };

      const result = await analyticsService.getTaskAnalytics(filter);
      successResponse(res, 'Task analytics retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AnalyticsController();
