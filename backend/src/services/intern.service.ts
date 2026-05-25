import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { PaginatedResponse } from '../types';
import { Intern, InternStatus, Prisma, UserRole } from '@prisma/client';
import { hashPassword, generateResetToken, hashResetToken } from '../utils/password';
import { safeAddJob } from '../queues/notification.queue';
import { logger } from '../utils/logger';
import { paginate } from '../utils/paginate';

/**
 * Intern with relations type
 */
type InternWithRelations = Prisma.InternGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        email: true;
        name: true;
        avatarUrl: true;
        isActive: true;
      };
    };
    department: true;
    mentor: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
            avatarUrl: true;
          };
        };
      };
    };
  };
}>;

/**
 * Create Intern Query Options
 */
interface InternQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: InternStatus;
  departmentId?: string;
  mentorId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create new intern
 */
export const createIntern = async (data: {
  userId: string;
  phone?: string;
  dob?: string;
  college: string;
  degree?: string;
  branch?: string;
  cgpa?: number;
  departmentId: string;
  mentorId?: string;
  skills?: string[];
  duration?: string;
  startDate?: string;
  whyJoin?: string;
  resumeUrl?: string;
}): Promise<InternWithRelations> => {
  // Check if user exists and is an intern
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role !== 'INTERN') {
    throw new AppError('User is not an intern', 400);
  }

  // Check if intern profile already exists
  const existingIntern = await prisma.intern.findUnique({
    where: { userId: data.userId },
  });

  if (existingIntern) {
    throw new AppError('Intern profile already exists', 409);
  }

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id: data.departmentId },
  });

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Check if mentor exists (if provided)
  if (data.mentorId) {
    const mentor = await prisma.mentor.findUnique({
      where: { id: data.mentorId },
    });

    if (!mentor) {
      throw new AppError('Mentor not found', 404);
    }
  }

  // Create intern
  const intern = await prisma.intern.create({
    data: {
      userId: data.userId,
      phone: data.phone,
      dob: data.dob ? new Date(data.dob) : undefined,
      college: data.college,
      degree: data.degree,
      branch: data.branch,
      cgpa: data.cgpa,
      departmentId: data.departmentId,
      mentorId: data.mentorId,
      skills: data.skills || [],
      duration: data.duration,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      whyJoin: data.whyJoin,
      resumeUrl: data.resumeUrl,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return intern;
};

/**
 * Get all interns with pagination and filters
 */
export const getAllInterns = async (
  options: InternQueryOptions
): Promise<PaginatedResponse<InternWithRelations>> => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    departmentId,
    mentorId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;


  // Build where clause
  const where: Prisma.InternWhereInput = {
    ...(status && { status }),
    ...(departmentId && { departmentId }),
    ...(mentorId && { mentorId }),
    ...(search && {
      OR: [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { college: { contains: search, mode: 'insensitive' } },
        { skills: { has: search } },
      ],
    }),
  };

  const result = await paginate({
    page,
    limit,
    where,
    orderBy: { [sortBy]: sortOrder },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    prismaModel: prisma.intern
  });

  return {
    data: result.data,
    pagination: {
      page: result.currentPage,
      limit: Number(limit),
      total: result.totalCount,
      totalPages: result.totalPages,
      hasNext: result.currentPage < result.totalPages,
      hasPrev: result.currentPage > 1,
    },
  };
};

/**
 * Get intern by ID
 */
export const getInternById = async (id: string): Promise<InternWithRelations> => {
  const intern = await prisma.intern.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
      tasks: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      feedbacks: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          mentor: {
            include: {
              user: {
                select: {
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!intern) {
    throw new AppError('Intern not found', 404);
  }

  return intern;
};

/**
 * Update intern
 */
export const updateIntern = async (
  id: string,
  data: Partial<Omit<Intern, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<InternWithRelations> => {
  // Check if intern exists
  const existingIntern = await prisma.intern.findUnique({
    where: { id },
  });

  if (!existingIntern) {
    throw new AppError('Intern not found', 404);
  }

  // Check if department exists (if updating)
  if (data.departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });

    if (!department) {
      throw new AppError('Department not found', 404);
    }
  }

  // Check if mentor exists (if updating)
  if (data.mentorId) {
    const mentor = await prisma.mentor.findUnique({
      where: { id: data.mentorId },
    });

    if (!mentor) {
      throw new AppError('Mentor not found', 404);
    }
  }

  // Update intern
  const intern = await prisma.intern.update({
    where: { id },
    data: {
      ...data,
      dob: data.dob ? new Date(data.dob as any) : undefined,
      startDate: data.startDate ? new Date(data.startDate as any) : undefined,
      completedDate: data.completedDate ? new Date(data.completedDate as any) : undefined,
    } as Prisma.InternUpdateInput,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  }) as unknown as InternWithRelations;

  // Welcome email on transition PENDING -> ONBOARDING
  if (existingIntern.status === InternStatus.PENDING && data.status === InternStatus.ONBOARDING) {
    try {
      const resetToken = generateResetToken();
      const hashedToken = hashResetToken(resetToken);

      // Save hashed token and expiry (24 hours) to user
      await prisma.user.update({
        where: { id: intern.userId },
        data: {
          resetPasswordToken: hashedToken,
          resetPasswordTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      await safeAddJob('send_welcome_email', {
        email: intern.user.email,
        name: intern.user.name,
        role: 'INTERN',
        resetToken: resetToken,
      });
    } catch (queueErr) {
      logger.error('Failed to queue welcome email:', queueErr);
    }
  }

  // Score update email when score changes
  if (data.score !== undefined && existingIntern.score !== data.score) {
    try {
      await safeAddJob('send_score_update', {
        email: intern.user.email,
        name: intern.user.name,
        score: data.score,
      });
    } catch (queueErr) {
      logger.error('Failed to queue score update email:', queueErr);
    }
  }

  // Update OnboardingProgress when transitioning to ACTIVE (HR Verification Approved)
  if (data.status === InternStatus.ACTIVE) {
    await prisma.onboardingProgress.updateMany({
      where: { internId: id },
      data: { verificationStatus: 'APPROVED' }
    });
  }

  return intern;
};

/**
 * Delete intern
 */
export const deleteIntern = async (id: string): Promise<void> => {
  // Check if intern exists
  const intern = await prisma.intern.findUnique({
    where: { id },
  });

  if (!intern) {
    throw new AppError('Intern not found', 404);
  }

  // Delete the underlying User. The database schema has 'onDelete: Cascade' 
  // on the Intern side, so deleting the User will automatically delete the Intern.
  await prisma.user.update({
    where: { id: intern.userId },
    data: { deletedAt: new Date() },
  });
  await prisma.intern.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

/**
 * Assign mentor to intern
 */
export const assignMentor = async (
  internId: string,
  mentorId: string
): Promise<InternWithRelations> => {
  // Check if intern exists
  const intern = await prisma.intern.findUnique({
    where: { id: internId },
  });

  if (!intern) {
    throw new AppError('Intern not found', 404);
  }

  // Check if mentor exists
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
  });

  if (!mentor) {
    throw new AppError('Mentor not found', 404);
  }

  // Update intern with mentor
  const updatedIntern = await prisma.intern.update({
    where: { id: internId },
    data: { mentorId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (updatedIntern.mentor && updatedIntern.mentor.user) {
    try {
      await safeAddJob('send_mentor_assignment', {
        internEmail: updatedIntern.user.email,
        internName: updatedIntern.user.name,
        mentorEmail: updatedIntern.mentor.user.email,
        mentorName: updatedIntern.mentor.user.name,
      });
    } catch (queueErr) {
      logger.error('Failed to queue mentor assignment email:', queueErr);
    }
  }

  return updatedIntern;
};

/**
 * Update intern skills
 */
export const updateInternSkills = async (
  internId: string,
  skills: string[]
): Promise<InternWithRelations> => {
  // Check if intern exists
  const intern = await prisma.intern.findUnique({
    where: { id: internId },
  });

  if (!intern) {
    throw new AppError('Intern not found', 404);
  }

  // Update skills
  const updatedIntern = await prisma.intern.update({
    where: { id: internId },
    data: { skills },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return updatedIntern;
};

/**
 * Get intern by user ID
 */
export const getInternByUserId = async (userId: string): Promise<InternWithRelations> => {
  const intern = await prisma.intern.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  if (!intern) {
    throw new AppError('Intern profile not found', 404);
  }

  return intern;
};

/**
 * Public candidate apply and register
 */
export const applyIntern = async (data: {
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  college: string;
  degree?: string;
  branch?: string;
  cgpa?: number;
  dept?: string;
  skills?: string[];
  duration?: string;
  startDate?: string;
  whyJoin?: string;
}): Promise<InternWithRelations> => {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError('A user with this email address already exists.', 409);
  }

  // Hash default password
  const hashedPassword = await hashPassword('InternPass123!');

  // Match department (case insensitive) or find a fallback
  const departments = await prisma.department.findMany();
  let selectedDept = departments.find(
    (d) => d.name.toLowerCase() === (data.dept || 'engineering').toLowerCase()
  );

  if (!selectedDept && departments.length > 0) {
    selectedDept = departments[0];
  }

  if (!selectedDept) {
    throw new AppError('No departments found in the system. Please seed the database first.', 500);
  }

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: UserRole.INTERN,
      isActive: true,
      isEmailVerified: true,
    },
  });

  // Create intern profile linked to the user
  const intern = await prisma.intern.create({
    data: {
      userId: user.id,
      phone: data.phone,
      dob: data.dob ? new Date(data.dob) : undefined,
      college: data.college,
      degree: data.degree || 'B.Tech',
      branch: data.branch || 'Computer Science',
      cgpa: data.cgpa || 8.5,
      departmentId: selectedDept.id,
      status: InternStatus.PENDING,
      skills: data.skills || [],
      duration: data.duration || '3 Months',
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      whyJoin: data.whyJoin,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  try {
    await safeAddJob('send_application_confirmation', {
      email: user.email,
      name: user.name,
      departmentName: selectedDept.name,
    });
  } catch (queueErr) {
    logger.error('Failed to queue application confirmation email:', queueErr);
  }

  return intern;
};

/**
 * Update onboarding form data for the logged-in intern
 * Only whitelisted onboarding-related columns are touched.
 */
export const updateOnboarding = async (
  internId: string,
  data: {
    phone?: string;
    dob?: string;
    college?: string;
    degree?: string;
    branch?: string;
    cgpa?: number;
    address?: string;
    emergencyName?: string;
    emergencyRelation?: string;
    emergencyPhone?: string;
    signedName?: string;
    agreementAccepted?: boolean;
    offerLetterAccepted?: boolean;
    onboardingStep?: number;
  }
): Promise<InternWithRelations> => {
  const intern = await prisma.intern.findUnique({ where: { id: internId } });
  if (!intern) {
    throw new AppError('Intern not found', 404);
  }

  // Build a safe update payload with only onboarding fields
  const updatePayload: any = {};
  if (data.phone !== undefined) updatePayload.phone = data.phone;
  if (data.dob !== undefined) updatePayload.dob = new Date(data.dob);
  if (data.college !== undefined) updatePayload.college = data.college;
  if (data.degree !== undefined) updatePayload.degree = data.degree;
  if (data.branch !== undefined) updatePayload.branch = data.branch;
  if (data.cgpa !== undefined) updatePayload.cgpa = data.cgpa;
  if (data.address !== undefined) updatePayload.address = data.address;
  if (data.emergencyName !== undefined) updatePayload.emergencyName = data.emergencyName;
  if (data.emergencyRelation !== undefined) updatePayload.emergencyRelation = data.emergencyRelation;
  if (data.emergencyPhone !== undefined) updatePayload.emergencyPhone = data.emergencyPhone;
  if (data.signedName !== undefined) updatePayload.signedName = data.signedName;
  if (data.agreementAccepted !== undefined) updatePayload.agreementAccepted = data.agreementAccepted;
  if (data.offerLetterAccepted !== undefined) updatePayload.offerLetterAccepted = data.offerLetterAccepted;
  if (data.onboardingStep !== undefined) updatePayload.onboardingStep = data.onboardingStep;

  // If submitting (step 7), transition status to ONBOARDING
  if (data.onboardingStep !== undefined && data.onboardingStep >= 7) {
    updatePayload.status = InternStatus.ONBOARDING;
  }

  const updated = await prisma.intern.update({
    where: { id: internId },
    data: updatePayload,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  // Notify HR when onboarding is submitted
  if (data.onboardingStep !== undefined && data.onboardingStep >= 7) {
    try {
      // Dynamic import to avoid circular dependency
      const notificationService = (await import('./notification.service')).default;
      await notificationService.notifyHR(
        'New Onboarding Submission',
        `Intern ${updated.user.name} has submitted their onboarding documents for verification.`,
        'SYSTEM',
        { internId: updated.id }
      );
    } catch (err) {
      logger.error('Failed to notify HR about onboarding submission:', err);
    }
  }

  return updated;
};

/**
 * Update onboarding document URL (idProof, marksheet, or resume)
 */
export const updateOnboardingDoc = async (
  internId: string,
  field: 'idProofUrl' | 'marksheetUrl' | 'resumeUrl' | 'aadhaarPanUrl' | 'collegeIdUrl' | 'passportPhotoUrl',
  url: string
): Promise<InternWithRelations> => {
  const intern = await prisma.intern.findUnique({ where: { id: internId } });
  if (!intern) {
    throw new AppError('Intern not found', 404);
  }

  const updated = await prisma.intern.update({
    where: { id: internId },
    data: { [field]: url },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return updated;
};

export const removeOnboardingDoc = async (
  internId: string,
  field: 'idProofUrl' | 'marksheetUrl' | 'resumeUrl' | 'aadhaarPanUrl' | 'collegeIdUrl' | 'passportPhotoUrl'
): Promise<InternWithRelations> => {
  const intern = await prisma.intern.findUnique({ where: { id: internId } });
  if (!intern) {
    throw new AppError('Intern not found', 404);
  }

  const updated = await prisma.intern.update({
    where: { id: internId },
    data: { [field]: null },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      mentor: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return updated;
};


