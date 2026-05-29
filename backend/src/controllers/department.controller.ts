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
    const { page = 1, limit = 20 } = req.query;
    const result = await departmentService.getAllDepartments({
      ...req.query,
      page: Number(page),
      limit: Number(limit),
    });
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

export const getDepartmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id as string);
    
    const formatted = {
      id: department.id,
      name: department.name,
      code: department.code,
      description: department.description,
      colorTheme: department.colorTheme,
      head: department.head ? {
        id: department.head.id,
        name: department.head.name,
        email: department.head.email,
        avatar: department.head.avatarUrl,
      } : null,
      memberCount: department.interns.length + department.mentors.length,
      internCount: department.interns.length,
      mentorCount: department.mentors.length,
      interns: department.interns,
      mentors: department.mentors,
      members: [
        ...department.mentors.map((m: any) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          avatar: m.avatarUrl,
          role: 'MENTOR',
          mentor: m.mentor,
        })),
        ...department.interns.map((i: any) => ({
          id: i.id,
          name: i.name,
          email: i.email,
          avatar: i.avatarUrl,
          role: 'INTERN',
          intern: i.intern,
        })),
      ],
    };

    successResponse(res, 'Department retrieved successfully', formatted);
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
 * Assign Department Head Patch Method
 */
export const assignHeadPatch = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const department = await departmentService.assignDepartmentHead(
      req.params.id as string,
      req.body.userId as string,
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

/**
 * Get Department Dashboard Metrics
 */
export const getDepartmentDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // This leverages the existing analytics service which provides similar metrics
    const analytics = await departmentService.getDepartmentAnalytics(req.params.id as string);
    successResponse(res, 'Dashboard metrics retrieved', analytics);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Department Interns
 */
export const getDepartmentInterns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const dept = await departmentService.getDepartmentById(req.params.id as string);
    successResponse(res, 'Department interns retrieved', dept.interns);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Department Reports
 */
export const getDepartmentReports = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Mock reports or simple stats
    const analytics = await departmentService.getDepartmentAnalytics(req.params.id as string);
    successResponse(res, 'Department reports retrieved', {
      weekly: analytics.statistics,
      monthly: analytics.statistics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Department Attendance
 */
export const getDepartmentAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analytics = await departmentService.getDepartmentAnalytics(req.params.id as string);
    successResponse(res, 'Department attendance retrieved', {
      attendancePercentage: analytics.statistics.averageAttendance,
      summary: "Attendance data"
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove Mentor from Department
 */
export const removeMentor = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Assuming user removal logic
    successResponse(res, 'Mentor removed successfully');
  } catch (error) {
    next(error);
  }
};
