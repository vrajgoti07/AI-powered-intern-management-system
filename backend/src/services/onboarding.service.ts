import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import notificationService from './notification.service';

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

  const intern = await prisma.intern.findUnique({
    where: { id: internId },
    include: { user: true }
  });

  if (!intern) throw new AppError('Intern not found', 404);

  const updatedProgress = await prisma.onboardingProgress.update({
    where: { internId },
    data: {
      finalSubmitted: true,
      currentStep: 8,
      verificationStatus: 'UNDER_REVIEW'
    }
  });

  await prisma.intern.update({
    where: { id: internId },
    data: { onboardingStep: 8 }
  });

  // Notify all active HR users that an intern has submitted onboarding details and needs review
  try {
    await notificationService.notifyHR(
      'New Onboarding Submission',
      `Intern ${intern.user.name} has completed all onboarding details and is awaiting verification/approval.`,
      'ONBOARDING_SUBMISSION',
      {
        internId: intern.id,
        internName: intern.user.name,
        userId: intern.userId
      }
    );
  } catch (err) {
    console.error('Failed to trigger onboarding completion notification for HR:', err);
  }

  return updatedProgress;
};

export const saveDraft = async (internId: string, data: any) => {
  const progress = await getOnboardingStatus(internId);
  
  const {
    fullName,
    dob,
    gender,
    address,
    phone,
    college,
    degree,
    branch,
    semester,
    cgpa,
    skills,
    parentName,
    parentPhone,
    emergencyName,
    emergencyPhone,
    emergencyRelation,
    signedName,
    agreementAccepted,
    offerLetterAccepted
  } = data;

  const intern = await prisma.intern.findUnique({ where: { id: internId }, select: { userId: true } });
  if (!intern) throw new AppError('Intern not found', 404);

  // 1. Update User name if fullName is provided
  if (fullName !== undefined) {
    await prisma.user.update({
      where: { id: intern.userId },
      data: { name: fullName }
    });
  }

  // 2. Build Intern update payload
  const internUpdateData: any = {};
  if (phone !== undefined) internUpdateData.phone = phone;
  
  if (dob !== undefined && dob !== null && dob !== '') {
    const parsedDate = new Date(dob);
    if (!isNaN(parsedDate.getTime())) {
      internUpdateData.dob = parsedDate;
    }
  }
  
  if (gender !== undefined) internUpdateData.gender = gender;
  if (address !== undefined) internUpdateData.address = address;
  if (college !== undefined) internUpdateData.college = college;
  if (degree !== undefined) internUpdateData.degree = degree;
  if (branch !== undefined) internUpdateData.branch = branch;
  
  if (semester !== undefined && semester !== null && semester !== '') {
    const parsedSemester = parseInt(semester);
    if (!isNaN(parsedSemester)) {
      internUpdateData.semester = parsedSemester;
    }
  }
  
  if (cgpa !== undefined && cgpa !== null && cgpa !== '') {
    const parsedCgpa = parseFloat(cgpa);
    if (!isNaN(parsedCgpa)) {
      internUpdateData.cgpa = parsedCgpa;
    }
  }
  
  if (skills !== undefined) {
    let skillsArray: string[] = [];
    if (Array.isArray(skills)) {
      skillsArray = skills;
    } else if (typeof skills === 'string') {
      skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
    }
    internUpdateData.skills = skillsArray;
  }
  
  if (parentName !== undefined) internUpdateData.parentName = parentName;
  if (parentPhone !== undefined) internUpdateData.parentPhone = parentPhone;
  if (emergencyName !== undefined) internUpdateData.emergencyName = emergencyName;
  if (emergencyPhone !== undefined) internUpdateData.emergencyPhone = emergencyPhone;
  if (emergencyRelation !== undefined) internUpdateData.emergencyRelation = emergencyRelation;
  if (signedName !== undefined) internUpdateData.signedName = signedName;
  if (agreementAccepted !== undefined) internUpdateData.agreementAccepted = agreementAccepted;
  if (offerLetterAccepted !== undefined) internUpdateData.offerLetterAccepted = offerLetterAccepted;

  await prisma.intern.update({
    where: { id: internId },
    data: internUpdateData
  });

  return progress;
};
