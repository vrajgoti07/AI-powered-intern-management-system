import { Request, Response, NextFunction } from 'express';
import * as internService from '../services/intern.service';
import { successResponse } from '../utils/response';
import notificationService from '../services/notification.service';
import { emailQueue } from '../queues/queue.config';
import prisma from '../config/database';

/**
 * Create new intern
 */
export const createIntern = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const intern = await internService.createIntern(req.body);
    successResponse(res, 'Intern created successfully', intern, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all interns with pagination and filters
 */
export const getAllInterns = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await internService.getAllInterns({
      ...req.query,
      page: Number(page),
      limit: Number(limit),
    });
    successResponse(res, 'Interns retrieved successfully', result);
  } catch (error) {
    next(error);
  }
};

/**
 * Get intern by ID
 */
export const getInternById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const intern = await internService.getInternById(req.params.id as string);
    successResponse(res, 'Intern retrieved successfully', intern);
  } catch (error) {
    next(error);
  }
};

/**
 * Update intern
 */
export const updateIntern = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const intern = await internService.updateIntern(req.params.id as string, req.body);
    
    // Check if status changed to OFFERED
    if (req.body.status === 'OFFERED' && intern.userId) {
      await notificationService.sendToUser(intern.userId, 'offer:received', {
        title: 'Internship Offer Received',
        message: 'Congratulations! You have received an internship offer.',
        type: 'SYSTEM',
        payload: { internId: intern.id }
      });

      const user = await prisma.user.findUnique({ where: { id: intern.userId }, include: { department: true } });
      if (user?.email) {
        await emailQueue.add('OFFER_LETTER', {
          to: user.email,
          data: {
            name: user.name,
            position: 'Intern',
            department: user.department?.name || 'Your Department',
            startDate: intern.startDate ? new Date(intern.startDate).toISOString().split('T')[0] : 'TBD',
            endDate: intern.completedDate ? new Date(intern.completedDate).toISOString().split('T')[0] : 'TBD',
            mentorName: 'Your Assigned Mentor',
            hrName: 'HR Department'
          }
        });
      }
    }

    if (req.body.status === 'COMPLETED' && intern.userId) {
      const user = await prisma.user.findUnique({ where: { id: intern.userId }, include: { department: true } });
      if (user?.email) {
        await emailQueue.add('CERTIFICATE_ISSUED', {
          to: user.email,
          data: {
            name: user.name,
            position: 'Intern',
            department: user.department?.name || 'Your Department',
            startDate: intern.startDate ? new Date(intern.startDate).toISOString().split('T')[0] : 'N/A',
            endDate: intern.completedDate ? new Date(intern.completedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            pdfUrl: `${process.env.FRONTEND_URL}/certificates/${intern.id}`
          }
        });
      }
    }

    successResponse(res, 'Intern updated successfully', intern);

  } catch (error) {
    next(error);
  }
};

/**
 * Delete intern
 */
export const deleteIntern = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await internService.deleteIntern(req.params.id as string);
    successResponse(res, 'Intern deleted successfully', null, 204);
  } catch (error) {
    next(error);
  }
};

/**
 * Assign mentor to intern
 */
export const assignMentor = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const intern = await internService.assignMentor(
      req.params.id as string,
      req.body.mentorId
    );
    successResponse(res, 'Mentor assigned successfully', intern);
  } catch (error) {
    next(error);
  }
};

/**
 * Update intern skills
 */
export const updateSkills = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const intern = await internService.updateInternSkills(
      req.params.id as string,
      req.body.skills
    );
    successResponse(res, 'Skills updated successfully', intern);
  } catch (error) {
    next(error);
  }
};

/**
 * Get intern by user ID
 */
export const getInternByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const intern = await internService.getInternByUserId(req.params.userId as string);
    if (!intern) {
      successResponse(res, 'No intern profile found for this user', null);
      return;
    }
    successResponse(res, 'Intern profile retrieved successfully', intern);
  } catch (error) {
    next(error);
  }
};

/**
 * Public candidate apply and register
 */
export const applyIntern = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const intern = await internService.applyIntern(req.body);
    successResponse(res, 'Application submitted successfully', intern, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update onboarding form data for the logged-in intern
 */
export const updateOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const internId = (req as any).user?.intern?.id;
    if (!internId) {
      res.status(403).json({ success: false, message: 'No intern profile found for this user' });
      return;
    }

    const intern = await internService.updateOnboarding(internId, req.body);
    successResponse(res, 'Onboarding data saved successfully', intern);
  } catch (error) {
    next(error);
  }
};

/**
 * Upload onboarding document (idProof, marksheet, resume)
 */
export const uploadOnboardingDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const internId = (req as any).user?.intern?.id;
    if (!internId) {
      res.status(403).json({ success: false, message: 'No intern profile found for this user' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }

    // Determine which document field to update based on query param
    const docType = req.query.docType as string;
    const fieldMap: Record<string, 'idProofUrl' | 'marksheetUrl' | 'resumeUrl' | 'aadhaarPanUrl' | 'collegeIdUrl' | 'passportPhotoUrl'> = {
      idProof: 'idProofUrl',
      marksheet: 'marksheetUrl',
      resume: 'resumeUrl',
      aadhaarPan: 'aadhaarPanUrl',
      collegeId: 'collegeIdUrl',
      passportPhoto: 'passportPhotoUrl',
    };

    const field = fieldMap[docType] || 'resumeUrl';
    let fileUrl: string;
    const filePath = (req.file as any).path || '';
    if (filePath.startsWith('http')) {
      // Cloudinary URL — use directly (convert to https if needed)
      fileUrl = filePath.replace(/^http:\/\//, 'https://');
    } else {
      // Local disk fallback
      fileUrl = `http://localhost:5000/uploads/${(req.file as any).filename}`;
    }

    const intern = await internService.updateOnboardingDoc(internId, field, fileUrl);
    successResponse(res, 'Document uploaded successfully', { url: fileUrl, intern });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove onboarding document (idProof, marksheet, resume, etc.)
 */
export const removeOnboardingDoc = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const internId = (req as any).user?.intern?.id;
    if (!internId) {
      res.status(403).json({ success: false, message: 'No intern profile found for this user' });
      return;
    }

    const docType = req.query.docType as string;
    const fieldMap: Record<string, 'idProofUrl' | 'marksheetUrl' | 'resumeUrl' | 'aadhaarPanUrl' | 'collegeIdUrl' | 'passportPhotoUrl'> = {
      idProof: 'idProofUrl',
      marksheet: 'marksheetUrl',
      resume: 'resumeUrl',
      aadhaarPan: 'aadhaarPanUrl',
      collegeId: 'collegeIdUrl',
      passportPhoto: 'passportPhotoUrl',
    };

    const field = fieldMap[docType];
    if (!field) {
      res.status(400).json({ success: false, message: 'Invalid document type' });
      return;
    }

    const intern = await internService.removeOnboardingDoc(internId, field);
    successResponse(res, 'Document removed successfully', intern);
  } catch (error) {
    next(error);
  }
};


