import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { successResponse } from '../utils/response';
import * as standupService from '../services/standup.service';
import prisma from '../config/database';

/**
 * Submit daily standup report
 * POST /api/standups/submit
 */
export const submitMyStandup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (req.user?.role !== 'INTERN') {
    throw new AppError('Only interns can submit daily standups.', 403);
  }

  const intern = await prisma.intern.findUnique({
    where: { userId: req.user.id },
  });

  if (!intern) {
    throw new AppError('Intern profile not found.', 404);
  }

  const { yesterday, today, blockers, mood } = req.body;

  if (!yesterday || !today || !mood) {
    throw new AppError('Yesterday, today, and mood selection are required fields.', 400);
  }

  const standup = await standupService.submitStandup(intern.id, req.user.organizationId!, {
    yesterday,
    today,
    blockers,
    mood,
  });

  successResponse(res, 'Daily standup report submitted successfully', standup);
});

/**
 * Get today's daily standup report status
 * GET /api/standups/today
 */
export const getTodayMyStandup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (req.user?.role !== 'INTERN') {
    throw new AppError('Only interns can retrieve personal daily standup reports.', 403);
  }

  const intern = await prisma.intern.findUnique({
    where: { userId: req.user.id },
  });

  if (!intern) {
    throw new AppError('Intern profile not found.', 404);
  }

  const standup = await standupService.getTodayStandup(intern.id);
  successResponse(res, 'Today\'s daily standup status retrieved successfully', standup);
});

/**
 * Get paginated standup history logs for the current intern
 * GET /api/standups/my-history
 */
export const getMyStandupHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (req.user?.role !== 'INTERN') {
    throw new AppError('Only interns can view personal daily standup logs.', 403);
  }

  const intern = await prisma.intern.findUnique({
    where: { userId: req.user.id },
  });

  if (!intern) {
    throw new AppError('Intern profile not found.', 404);
  }

  const page = parseInt(req.query.page as string || '1', 10);
  const limit = parseInt(req.query.limit as string || '10', 10);

  const history = await standupService.getStandupHistory(intern.id, page, limit);
  successResponse(res, 'Daily standup history logs retrieved successfully', history);
});

/**
 * Fetch organization daily team standups feed (HR/Mentors/HODs)
 * GET /api/standups/team
 */
export const getOrgTeamStandups = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const allowedRoles = ['HR', 'MENTOR', 'DEPARTMENT_HEAD', 'SUPER_ADMIN'];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    throw new AppError('Unauthorized access to team standup feeds.', 403);
  }

  const dateParam = req.query.date as string;
  const date = dateParam ? new Date(dateParam) : new Date();

  const standups = await standupService.getTeamStandups(req.user.organizationId!, date);
  successResponse(res, 'Team daily standups feed retrieved successfully', standups);
});

/**
 * Retrieve standup configuration settings for organization
 * GET /api/standups/settings
 */
export const getOrgSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user || (req.user.role !== 'HR' && req.user.role !== 'DEPARTMENT_HEAD' && req.user.role !== 'SUPER_ADMIN')) {
    throw new AppError('Unauthorized access to standup configuration.', 403);
  }

  const settings = await standupService.getStandupSettings(req.user.organizationId!);
  successResponse(res, 'Daily standup configuration settings retrieved successfully', settings);
});

/**
 * Update standup configuration settings for organization
 * PUT /api/standups/settings
 */
export const updateOrgSettings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user || (req.user.role !== 'HR' && req.user.role !== 'DEPARTMENT_HEAD' && req.user.role !== 'SUPER_ADMIN')) {
    throw new AppError('Unauthorized access to standup configuration.', 403);
  }

  const settings = await standupService.updateStandupSettings(req.user.organizationId!, req.body);
  successResponse(res, 'Daily standup configuration settings updated successfully', settings);
});
