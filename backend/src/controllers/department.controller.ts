import { Request, Response, NextFunction } from 'express';
import * as departmentService from '../services/department.service';
import { successResponse } from '../utils/response';

/**
 * Create new department
 */
export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const department = await departmentService.createDepartment(req.body);
    successResponse(res, 'Department created successfully', department, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all departments with pagination and filters
 */
export const getAllDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await departmentService.getAllDepartments(req.query);
    successResponse(res, 'Departments retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all departments list (simple, no pagination)
 */
export const getAllDepartmentsList = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const departments = await departmentService.getAllDepartmentsList();
    successResponse(res, 'Departments list retrieved successfully', departments);
  } catch (error) {
    next(error);
  }
};

/**
 * Get department by ID
 */
export const getDepartmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id as string);
    successResponse(res, 'Department retrieved successfully', department);
  } catch (error) {
    next(error);
  }
};

/**
 * Update department
 */
export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const department = await departmentService.updateDepartment(
      req.params.id as string,
      req.body
    );
    successResponse(res, 'Department updated successfully', department);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete department
 */
export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await departmentService.deleteDepartment(req.params.id as string);
    successResponse(res, 'Department deleted successfully', null, 204);
  } catch (error) {
    next(error);
  }
};

/**
 * Get department analytics
 */
export const getDepartmentAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analytics = await departmentService.getDepartmentAnalytics(req.params.id as string);
    successResponse(res, 'Department analytics retrieved successfully', analytics);
  } catch (error) {
    next(error);
  }
};
