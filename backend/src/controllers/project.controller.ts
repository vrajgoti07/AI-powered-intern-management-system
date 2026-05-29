import { Request, Response, NextFunction } from 'express';
import * as projectService from '../services/project.service';
import { successResponse } from '../utils/response';

export const createProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const project = await projectService.createProject(req.params.id as string, req.body);
    successResponse(res, 'Project created successfully', project, 201);
  } catch (error) {
    next(error);
  }
};

export const getProjects = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const projects = await projectService.getProjectsByDepartment(req.params.id as string);
    successResponse(res, 'Projects retrieved successfully', projects);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const project = await projectService.updateProject(req.params.id as string, req.body);
    successResponse(res, 'Project updated successfully', project);
  } catch (error) {
    next(error);
  }
};

export const assignIntern = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { internId, role } = req.body;
    const assignment = await projectService.assignInternToProject(req.params.id as string, internId, role);
    successResponse(res, 'Intern assigned to project successfully', assignment, 201);
  } catch (error) {
    next(error);
  }
};
