import { Request, Response, NextFunction } from 'express';
import * as mentorDetailsService from '../services/mentorDetails.service';
import { successResponse } from '../utils/response';

/**
 * Get full mentor details
 */
export const getMentorDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentor = await mentorDetailsService.getFullMentorDetails(req.params.id as string);
    successResponse(res, 'Mentor details retrieved successfully', mentor);
  } catch (error) {
    next(error);
  }
};

/**
 * Update mentor profile
 */
export const updateMentorProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const mentor = await mentorDetailsService.updateMentorProfile(req.params.id as string, req.body);
    successResponse(res, 'Mentor profile updated successfully', mentor);
  } catch (error) {
    next(error);
  }
};

/**
 * Get mentor analytics
 */
export const getMentorAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analytics = await mentorDetailsService.getMentorAnalytics(req.params.id as string);
    successResponse(res, 'Mentor analytics retrieved successfully', analytics);
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh (recompute) mentor analytics
 */
export const refreshMentorAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analytics = await mentorDetailsService.computeAndStoreAnalytics(req.params.id as string);
    successResponse(res, 'Mentor analytics refreshed successfully', analytics);
  } catch (error) {
    next(error);
  }
};

/**
 * Get mentor activity timeline
 */
export const getMentorActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page, limit, activityType } = req.query as any;
    const activity = await mentorDetailsService.getMentorActivity(
      req.params.id as string,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      activityType as string | undefined
    );
    successResponse(res, 'Mentor activity retrieved successfully', activity);
  } catch (error) {
    next(error);
  }
};

/**
 * Get assigned interns with performance data
 */
export const getMentorInterns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const interns = await mentorDetailsService.getMentorInterns(req.params.id as string);
    successResponse(res, 'Mentor interns retrieved successfully', interns);
  } catch (error) {
    next(error);
  }
};

/**
 * Assign a single intern to mentor
 */
export const assignInternToMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await mentorDetailsService.assignInternToMentor(
      req.params.id as string,
      req.body.internId
    );
    successResponse(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Remove intern from mentor
 */
export const removeInternFromMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await mentorDetailsService.removeInternFromMentor(
      req.params.id as string,
      req.params.internId as string
    );
    successResponse(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get mentor documents
 */
export const getMentorDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documents = await mentorDetailsService.getMentorDocuments(req.params.id as string);
    successResponse(res, 'Mentor documents retrieved successfully', documents);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload mentor document
 */
export const uploadMentorDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const file = req.file as any;
    if (!file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    // Cloudinary typically sets `path`, `url`, or `secure_url` to the remote URL.
    const rawUrl = file.secure_url || file.url || file.path || '';
    let fileUrl = '';
    if (rawUrl.startsWith('http')) {
      fileUrl = rawUrl.replace(/^http:\/\//, 'https://');
    } else if (file.filename) {
      fileUrl = `http://localhost:5000/uploads/${file.filename}`;
    }

    const document = await mentorDetailsService.uploadMentorDocument(req.params.id as string, {
      fileName: file.originalname || file.original_filename || 'document',
      fileUrl: fileUrl,
      fileType: req.body.fileType || 'certificate',
      fileSize: file.size || file.bytes || 0,
    });
    successResponse(res, 'Document uploaded successfully', document, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete mentor document
 */
export const deleteMentorDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await mentorDetailsService.deleteMentorDocument(
      req.params.id as string,
      req.params.docId as string
    );
    successResponse(res, result.message, result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get mentor workload analysis
 */
export const getMentorWorkload = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const workload = await mentorDetailsService.getWorkloadAnalysis(req.params.id as string);
    successResponse(res, 'Mentor workload retrieved successfully', workload);
  } catch (error) {
    next(error);
  }
};

/**
 * Trigger AI analysis for mentor
 */
export const getAIAnalysis = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const analysis = await mentorDetailsService.getAIMentorAnalysis(req.params.id as string);
    successResponse(res, 'AI analysis completed successfully', analysis);
  } catch (error) {
    next(error);
  }
};
