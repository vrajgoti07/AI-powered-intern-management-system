import { Request, Response, NextFunction } from 'express';
import * as mentorService from '../services/mentor.service';
import { successResponse } from '../utils/response';

/**
 * Create new mentor
 */
export const createMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentor = await mentorService.createMentor(req.body);
    successResponse(res, 'Mentor created successfully', mentor, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all mentors with pagination and filters
 */
export const getAllMentors = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await mentorService.getAllMentors(req.query);
    successResponse(res, 'Mentors retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get mentor by ID
 */
export const getMentorById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentor = await mentorService.getMentorById(req.params.id as string);
    successResponse(res, 'Mentor retrieved successfully', mentor);
  } catch (error) {
    next(error);
  }
};

/**
 * Update mentor
 */
export const updateMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentor = await mentorService.updateMentor(req.params.id as string, req.body);
    successResponse(res, 'Mentor updated successfully', mentor);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete mentor
 */
export const deleteMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await mentorService.deleteMentor(req.params.id as string);
    successResponse(res, 'Mentor deleted successfully', null, 204);
  } catch (error) {
    next(error);
  }
};

/**
 * Assign interns to mentor
 */
export const assignInterns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentor = await mentorService.assignInterns(
      req.params.id as string,
      req.body.internIds
    );
    successResponse(res, 'Interns assigned successfully', mentor);
  } catch (error) {
    next(error);
  }
};

/**
 * Get mentor by user ID
 */
export const getMentorByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentor = await mentorService.getMentorByUserId(req.params.userId as string);
    successResponse(res, 'Mentor profile retrieved successfully', mentor);
  } catch (error) {
    next(error);
  }
};

/**
 * Get assigned interns for a mentor
 */
export const getAssignedInterns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const interns = await mentorService.getAssignedInterns(req.params.id as string);
    successResponse(res, 'Assigned interns retrieved successfully', interns);
  } catch (error) {
    next(error);
  }
};
