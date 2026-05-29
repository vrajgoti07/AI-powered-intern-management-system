import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/error.middleware';
import * as onboardingService from '../services/onboarding.service';
import { emailQueue } from '../queues/queue.config';


export const getStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internId = req.user?.intern?.id;
    if (!internId) throw new AppError('Intern not found', 404);

    const status = await onboardingService.getOnboardingStatus(internId);
    successResponse(res, 'Onboarding status retrieved', status);
  } catch (error) {
    next(error);
  }
};

export const submitOffer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internId = req.user?.intern?.id;
    if (!internId) throw new AppError('Intern not found', 404);

    const { offerAccepted } = req.body;
    const status = await onboardingService.submitOffer(internId, offerAccepted);

    if (offerAccepted && req.user?.email) {
      await emailQueue.add('ACCEPTANCE_CONFIRMATION', {
        to: req.user.email,
        data: {
          name: req.user.name,
        }
      });
    }

    successResponse(res, 'Offer step completed', status);
  } catch (error) {
    next(error);
  }
};

export const submitPersonalInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internId = req.user?.intern?.id;
    if (!internId) throw new AppError('Intern not found', 404);

    const status = await onboardingService.submitPersonalInfo(internId, req.body);
    successResponse(res, 'Personal Info step completed', status);
  } catch (error) {
    next(error);
  }
};

export const submitEducation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internId = req.user?.intern?.id;
    if (!internId) throw new AppError('Intern not found', 404);

    const status = await onboardingService.submitEducation(internId, req.body);
    successResponse(res, 'Education step completed', status);
  } catch (error) {
    next(error);
  }
};

export const submitEmergency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internId = req.user?.intern?.id;
    if (!internId) throw new AppError('Intern not found', 404);

    const status = await onboardingService.submitEmergency(internId, req.body);
    successResponse(res, 'Emergency step completed', status);
  } catch (error) {
    next(error);
  }
};

export const submitDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internId = req.user?.intern?.id;
    if (!internId) throw new AppError('Intern not found', 404);

    const status = await onboardingService.submitDocuments(internId);
    successResponse(res, 'Documents step completed', status);
  } catch (error) {
    next(error);
  }
};

export const submitAgreement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internId = req.user?.intern?.id;
    if (!internId) throw new AppError('Intern not found', 404);

    const status = await onboardingService.submitAgreement(internId, req.body);
    successResponse(res, 'Agreement step completed', status);
  } catch (error) {
    next(error);
  }
};

export const submitFinal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const internId = req.user?.intern?.id;
    if (!internId) throw new AppError('Intern not found', 404);

    const status = await onboardingService.submitFinal(internId);
    successResponse(res, 'Onboarding submitted for review', status);
  } catch (error) {
    next(error);
  }
};
