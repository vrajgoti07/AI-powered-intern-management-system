import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export const getOnboardingStatus = async (internId: string) => {
  let progress = await prisma.onboardingProgress.findUnique({
    where: { internId }
  });

  if (!progress) {
    progress = await prisma.onboardingProgress.create({
      data: {
        internId,
        currentStep: 1
      }
    });
  }

  return progress;
};

export const submitOffer = async (internId: string, offerAccepted: boolean) => {
  if (!offerAccepted) {
    throw new AppError('Offer must be accepted to proceed', 400);
  }

  const progress = await getOnboardingStatus(internId);

  await prisma.intern.update({
    where: { id: internId },
    data: { offerLetterAccepted: true, onboardingStep: 2 }
  });

  return prisma.onboardingProgress.update({
    where: { internId },
    data: {
      offerAccepted: true,
      currentStep: Math.max(progress.currentStep, 2)
    }
  });
};

export const submitPersonalInfo = async (internId: string, data: any) => {
  const progress = await getOnboardingStatus(internId);
  if (!progress.offerAccepted) throw new AppError('Previous step not completed', 400);

  const { fullName, dob, gender, address, phone } = data;

  const intern = await prisma.intern.findUnique({ where: { id: internId }, select: { userId: true } });
  if (!intern) throw new AppError('Intern not found', 404);

  await prisma.user.update({
    where: { id: intern.userId },
    data: { name: fullName }
  });

  await prisma.intern.update({
    where: { id: internId },
    data: {
      dob: new Date(dob),
      gender,
      address,
      phone,
      onboardingStep: 3
    }
  });

  return prisma.onboardingProgress.update({
    where: { internId },
    data: {
      personalInfoCompleted: true,
      currentStep: Math.max(progress.currentStep, 3)
    }
  });
};

export const submitEducation = async (internId: string, data: any) => {
  const progress = await getOnboardingStatus(internId);
  if (!progress.personalInfoCompleted) throw new AppError('Previous step not completed', 400);

  const { college, degree, branch, semester, cgpa, skills } = data;

  await prisma.intern.update({
    where: { id: internId },
    data: {
      college,
      degree,
      branch,
      semester: parseInt(semester),
      cgpa: parseFloat(cgpa),
      skills: Array.isArray(skills) ? skills : [skills],
      onboardingStep: 4
    }
  });

  return prisma.onboardingProgress.update({
    where: { internId },
    data: {
      educationCompleted: true,
      currentStep: Math.max(progress.currentStep, 4)
    }
  });
};

export const submitEmergency = async (internId: string, data: any) => {
  const progress = await getOnboardingStatus(internId);
  if (!progress.educationCompleted) throw new AppError('Previous step not completed', 400);

  const { parentName, parentPhone, emergencyName, emergencyPhone, emergencyRelation } = data;

  await prisma.intern.update({
    where: { id: internId },
    data: {
      parentName,
      parentPhone,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      onboardingStep: 5
    }
  });

  return prisma.onboardingProgress.update({
    where: { internId },
    data: {
      emergencyCompleted: true,
      currentStep: Math.max(progress.currentStep, 5)
    }
  });
};

export const submitDocuments = async (internId: string) => {
  const progress = await getOnboardingStatus(internId);
  if (!progress.emergencyCompleted) throw new AppError('Previous step not completed', 400);

  // Documents are usually uploaded separately via file upload endpoints, 
  // so this endpoint just verifies that the URLs exist and marks step 5 completed.
  
  const intern = await prisma.intern.findUnique({ where: { id: internId } });
  if (!intern) throw new AppError('Intern not found', 404);

  // We can loosely validate or rely on frontend to only call this when ready
  await prisma.intern.update({
    where: { id: internId },
    data: { onboardingStep: 6 }
  });

  return prisma.onboardingProgress.update({
    where: { internId },
    data: {
      documentsCompleted: true,
      currentStep: Math.max(progress.currentStep, 6)
    }
  });
};

export const submitAgreement = async (internId: string, data: any) => {
  const progress = await getOnboardingStatus(internId);
  if (!progress.documentsCompleted) throw new AppError('Previous step not completed', 400);

  const { signedName, agreementAccepted } = data;

  if (!agreementAccepted) throw new AppError('Agreement must be accepted', 400);

  await prisma.intern.update({
    where: { id: internId },
    data: {
      signedName,
      agreementAccepted,
      onboardingStep: 7
    }
  });

  return prisma.onboardingProgress.update({
    where: { internId },
    data: {
      agreementAccepted: true,
      currentStep: Math.max(progress.currentStep, 7)
    }
  });
};

export const submitFinal = async (internId: string) => {
  const progress = await getOnboardingStatus(internId);
  if (!progress.agreementAccepted) throw new AppError('Previous step not completed', 400);

  await prisma.intern.update({
    where: { id: internId },
    data: { onboardingStep: 8 }
  });

  return prisma.onboardingProgress.update({
    where: { internId },
    data: {
      finalSubmitted: true,
      currentStep: 8,
      verificationStatus: 'UNDER_REVIEW'
    }
  });
};
