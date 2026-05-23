import { Request, Response, NextFunction } from 'express';
import * as hrService from '../services/hr.service';
import { successResponse } from '../utils/response';

/**
 * Get HR Dashboard
 */
export const getHRDashboard = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dashboard = await hrService.getHRDashboard();
    successResponse(res, 'HR dashboard retrieved successfully', dashboard);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await hrService.getAllUsers(req.query);
    successResponse(res, 'Users retrieved successfully', users);
  } catch (error) {
    next(error);
  }
};

/**
 * Get intern statistics
 */
export const getInternStatistics = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await hrService.getInternStatistics();
    successResponse(res, 'Intern statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Get mentor statistics
 */
export const getMentorStatistics = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const stats = await hrService.getMentorStatistics();
    successResponse(res, 'Mentor statistics retrieved successfully', stats);
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update user status
 */
export const bulkUpdateUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const count = await hrService.bulkUpdateUserStatus(
      req.body.userIds,
      req.body.isActive
    );
    successResponse(res, `${count} users updated successfully`, { count });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await hrService.deleteUser(req.params.userId as string);
    successResponse(res, 'User deleted successfully', null, 204);
  } catch (error) {
    next(error);
  }
};
