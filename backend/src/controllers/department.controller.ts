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
    successResponse(res, 'Department deleted successfully', null, 200);
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

/**
 * Assign Department Head
 */
export const assignHead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const department = await departmentService.assignDepartmentHead(
      req.params.id as string,
      req.body.headId as string,
      (req as any).user?.name || 'HR Admin'
    );
    successResponse(res, 'Department head assigned successfully', department);
  } catch (error) {
    next(error);
  }
};

/**
 * Assign Mentor to Department
 */
export const assignMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await departmentService.assignMentor(
      req.params.id as string,
      req.body.mentorId as string,
      (req as any).user?.name || 'HR Admin'
    );
    successResponse(res, 'Mentor assigned to department successfully', null);
  } catch (error) {
    next(error);
  }
};

/**
 * Move Intern to Department
 */
export const moveIntern = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await departmentService.moveIntern(
      req.params.id as string,
      req.body.internId as string,
      (req as any).user?.name || 'HR Admin'
    );
    successResponse(res, 'Intern transferred to department successfully', null);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Department Activity Logs
 */
export const getActivityLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const logs = await departmentService.getDepartmentActivityLogs(req.params.id as string);
    successResponse(res, 'Department activity logs retrieved successfully', logs);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Company Hierarchy tree
 */
export const getHierarchy = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tree = await departmentService.getDepartmentHierarchy();
    successResponse(res, 'Company hierarchy retrieved successfully', tree);
  } catch (error) {
    next(error);
  }
};
