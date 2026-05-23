import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { PaginatedResponse } from '../types';
import { Prisma } from '@prisma/client';
import { safeAddJob } from '../queues/notification.queue';
import { logger } from '../utils/logger';

/**
 * Mentor with relations type
 */
type MentorWithRelations = Prisma.MentorGetPayload<{
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
    interns: {
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
 * Mentor Query Options
 */
interface MentorQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create new mentor
 */
export const createMentor = async (data: {
  userId: string;
  departmentId: string;
  expertise: string[];
  bio?: string;
}): Promise<MentorWithRelations> => {
  // Check if user exists and is a mentor
  const user = await prisma.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.role !== 'MENTOR') {
    throw new AppError('User is not a mentor', 400);
  }

  // Check if mentor profile already exists
  const existingMentor = await prisma.mentor.findUnique({
    where: { userId: data.userId },
  });

  if (existingMentor) {
    throw new AppError('Mentor profile already exists', 409);
  }

  // Check if department exists
  const department = await prisma.department.findUnique({
    where: { id: data.departmentId },
  });

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Create mentor
  const mentor = await prisma.mentor.create({
    data: {
      userId: data.userId,
      departmentId: data.departmentId,
      expertise: data.expertise,
      bio: data.bio,
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
      interns: {
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

  return mentor;
};

/**
 * Get all mentors with pagination and filters
 */
export const getAllMentors = async (
  options: MentorQueryOptions
): Promise<PaginatedResponse<MentorWithRelations>> => {
  const {
    page = 1,
    limit = 10,
    search,
    departmentId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.MentorWhereInput = {
    ...(departmentId && { departmentId }),
    ...(search && {
      OR: [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { expertise: { has: search } },
      ],
    }),
  };

  // Get total count
  const total = await prisma.mentor.count({ where });

  // Get mentors
  const mentors = await prisma.mentor.findMany({
    where,
    skip,
    take: limit,
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
      interns: {
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

  const totalPages = Math.ceil(total / limit);

  return {
    data: mentors,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Get mentor by ID
 */
export const getMentorById = async (id: string): Promise<MentorWithRelations> => {
  const mentor = await prisma.mentor.findUnique({
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
      interns: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          department: true,
        },
      },
      tasks: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          intern: {
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
      feedbacks: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          intern: {
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

  if (!mentor) {
    throw new AppError('Mentor not found', 404);
  }

  return mentor;
};

/**
 * Update mentor
 */
export const updateMentor = async (
  id: string,
  data: {
    departmentId?: string;
    rating?: number;
    expertise?: string[];
    bio?: string;
  }
): Promise<MentorWithRelations> => {
  // Check if mentor exists
  const existingMentor = await prisma.mentor.findUnique({
    where: { id },
  });

  if (!existingMentor) {
    throw new AppError('Mentor not found', 404);
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

  // Update mentor
  const mentor = await prisma.mentor.update({
    where: { id },
    data,
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
      interns: {
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

  return mentor;
};

/**
 * Delete mentor
 */
export const deleteMentor = async (id: string): Promise<void> => {
  // Check if mentor exists
  const mentor = await prisma.mentor.findUnique({
    where: { id },
    include: {
      interns: true,
    },
  });

  if (!mentor) {
    throw new AppError('Mentor not found', 404);
  }

  // Check if mentor has assigned interns
  if (mentor.interns.length > 0) {
    throw new AppError(
      'Cannot delete mentor with assigned interns. Please reassign interns first.',
      400
    );
  }

  // Delete mentor
  await prisma.mentor.delete({
    where: { id },
  });
};

/**
 * Assign interns to mentor
 */
export const assignInterns = async (
  mentorId: string,
  internIds: string[]
): Promise<MentorWithRelations> => {
  // Check if mentor exists
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
  });

  if (!mentor) {
    throw new AppError('Mentor not found', 404);
  }

  // Check if all interns exist
  const interns = await prisma.intern.findMany({
    where: { id: { in: internIds } },
  });

  if (interns.length !== internIds.length) {
    throw new AppError('One or more interns not found', 404);
  }

  // Assign interns to mentor
  await prisma.intern.updateMany({
    where: { id: { in: internIds } },
    data: { mentorId },
  });

  // Return updated mentor
  const updatedMentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
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
      interns: {
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

  if (updatedMentor && updatedMentor.user) {
    for (const intern of updatedMentor.interns) {
      if (intern.user) {
        try {
          await safeAddJob('send_mentor_assignment', {
            internEmail: intern.user.email,
            internName: intern.user.name,
            mentorEmail: updatedMentor.user.email,
            mentorName: updatedMentor.user.name,
          });
        } catch (queueErr) {
          logger.error('Failed to queue mentor assignment email inside assignInterns:', queueErr);
        }
      }
    }
  }

  return updatedMentor!;
};

/**
 * Get mentor by user ID
 */
export const getMentorByUserId = async (userId: string): Promise<MentorWithRelations> => {
  const mentor = await prisma.mentor.findUnique({
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
      interns: {
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

  if (!mentor) {
    throw new AppError('Mentor profile not found', 404);
  }

  return mentor;
};

/**
 * Get assigned interns for a mentor
 */
export const getAssignedInterns = async (mentorId: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
  });

  if (!mentor) {
    throw new AppError('Mentor not found', 404);
  }

  const interns = await prisma.intern.findMany({
    where: { mentorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
    },
  });

  return interns;
};
