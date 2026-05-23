import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { PaginatedResponse } from '../types';
import { Department, Prisma, UserRole } from '@prisma/client';

/**
 * Detailed Department with relations type
 */
type DepartmentWithRelations = Prisma.DepartmentGetPayload<{
  include: {
    head: {
      select: {
        id: true;
        name: true;
        email: true;
        avatarUrl: true;
      };
    };
    interns: {
      select: {
        id: true;
        name: true;
        email: true;
        avatarUrl: true;
        intern: {
          select: {
            id: true;
            status: true;
            score: true;
            attendance: true;
            college: true;
            onboardingProgress: true;
          };
        };
      };
    };
    mentors: {
      select: {
        id: true;
        name: true;
        email: true;
        avatarUrl: true;
        mentor: {
          select: {
            id: true;
            designation: true;
          };
        };
      };
    };
    projects: true;
    activities: {
      take: 50;
      orderBy: {
        createdAt: 'desc';
      };
    };
  };
}>;

/**
 * Department Query Options
 */
interface DepartmentQueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Create new department
 */
export const createDepartment = async (data: {
  name: string;
  code: string;
  color?: string;
  description?: string;
  headId?: string | null;
}): Promise<Department> => {
  // Check if department with same name or code exists
  const nameConflict = await prisma.department.findUnique({
    where: { name: data.name },
  });
  if (nameConflict) {
    throw new AppError('Department with this name already exists', 409);
  }

  const codeConflict = await prisma.department.findUnique({
    where: { code: data.code.toUpperCase() },
  });
  if (codeConflict) {
    throw new AppError('Department with this code already exists', 409);
  }

  // Create department
  const department = await prisma.department.create({
    data: {
      name: data.name,
      code: data.code.toUpperCase(),
      colorTheme: data.color || 'indigo',
      description: data.description,
      headId: data.headId || null,
    },
  });

  // If head is assigned, set their role to DEPARTMENT_HEAD
  if (data.headId) {
    await prisma.user.update({
      where: { id: data.headId },
      data: { role: UserRole.DEPARTMENT_HEAD },
    });

    const headUser = await prisma.user.findUnique({ where: { id: data.headId } });
    await prisma.departmentActivity.create({
      data: {
        departmentId: department.id,
        activityType: 'HEAD_ASSIGNED',
        description: `${headUser?.name || 'User'} assigned as Head of ${department.name}`,
        performedBy: 'HR Admin',
      },
    });
  }

  return department;
};

/**
 * Get all departments with pagination and filters
 */
export const getAllDepartments = async (
  options: DepartmentQueryOptions
): Promise<PaginatedResponse<DepartmentWithRelations>> => {
  const {
    page = 1,
    limit = 10,
    search,
    sortBy = 'name',
    sortOrder = 'asc',
  } = options;

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.DepartmentWhereInput = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  // Get total count
  const total = await prisma.department.count({ where });

  // Get departments
  const departments = await prisma.department.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      head: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      interns: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          intern: {
            select: {
              id: true,
              status: true,
              score: true,
              attendance: true,
              college: true,
              onboardingProgress: true,
            },
          },
        },
      },
      mentors: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          mentor: {
            select: {
              id: true,
              designation: true,
            },
          },
        },
      },
      projects: true,
      activities: {
        take: 50,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    data: departments as any[],
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
 * Get department by ID
 */
export const getDepartmentById = async (id: string): Promise<DepartmentWithRelations> => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      head: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      interns: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          intern: {
            select: {
              id: true,
              status: true,
              score: true,
              attendance: true,
              college: true,
              onboardingProgress: true,
            },
          },
        },
      },
      mentors: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          mentor: {
            select: {
              id: true,
              designation: true,
            },
          },
        },
      },
      projects: true,
      activities: {
        take: 50,
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  return department as any;
};

/**
 * Update department
 */
export const updateDepartment = async (
  id: string,
  data: {
    name?: string;
    code?: string;
    color?: string;
    description?: string;
    isActive?: boolean;
    headId?: string | null;
  }
): Promise<Department> => {
  // Check if department exists
  const existingDept = await prisma.department.findUnique({
    where: { id },
  });

  if (!existingDept) {
    throw new AppError('Department not found', 404);
  }

  // Check unique constraints
  if (data.name && data.name !== existingDept.name) {
    const nameConflict = await prisma.department.findUnique({ where: { name: data.name } });
    if (nameConflict) throw new AppError('Department with this name already exists', 409);
  }

  if (data.code && data.code.toUpperCase() !== existingDept.code) {
    const codeConflict = await prisma.department.findUnique({ where: { code: data.code.toUpperCase() } });
    if (codeConflict) throw new AppError('Department with this code already exists', 409);
  }

  // Handle headId update changes
  if (data.headId !== undefined && data.headId !== existingDept.headId) {
    // Revert previous head back to MENTOR if applicable
    if (existingDept.headId) {
      await prisma.user.update({
        where: { id: existingDept.headId },
        data: { role: UserRole.MENTOR },
      });
    }

    // Set new head to DEPARTMENT_HEAD role
    if (data.headId) {
      await prisma.user.update({
        where: { id: data.headId },
        data: { role: UserRole.DEPARTMENT_HEAD },
      });

      const newHead = await prisma.user.findUnique({ where: { id: data.headId } });
      await prisma.departmentActivity.create({
        data: {
          departmentId: id,
          activityType: 'HEAD_ASSIGNED',
          description: `${newHead?.name || 'User'} assigned as Head of ${data.name || existingDept.name}`,
          performedBy: 'HR Admin',
        },
      });
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code ? data.code.toUpperCase() : undefined,
      colorTheme: data.color,
      description: data.description,
      isActive: data.isActive,
      headId: data.headId,
    },
  });

  return updated;
};

/**
 * Delete department
 */
export const deleteDepartment = async (id: string): Promise<void> => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      interns: true,
      mentors: true,
    },
  });

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Ensure department has no assigned members
  if (department.interns.length > 0 || department.mentors.length > 0) {
    throw new AppError(
      'Cannot delete department with active assigned members. Please reassign interns and mentors first.',
      400
    );
  }

  // Revert head's role if configured
  if (department.headId) {
    await prisma.user.update({
      where: { id: department.headId },
      data: { role: UserRole.MENTOR },
    });
  }

  await prisma.department.delete({
    where: { id },
  });
};

/**
 * Assign Department Head
 */
export const assignDepartmentHead = async (id: string, headId: string, performedBy: string): Promise<Department> => {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) throw new AppError('Department not found', 404);

  const newHeadUser = await prisma.user.findUnique({ where: { id: headId } });
  if (!newHeadUser) throw new AppError('Selected user for Department Head does not exist', 404);

  // Revert previous head
  if (department.headId) {
    await prisma.user.update({
      where: { id: department.headId },
      data: { role: UserRole.MENTOR },
    });
  }

  // Update new head role
  await prisma.user.update({
    where: { id: headId },
    data: { role: UserRole.DEPARTMENT_HEAD },
  });

  // Link inside Department model
  const updatedDept = await prisma.department.update({
    where: { id },
    data: { headId },
  });

  // Log action
  await prisma.departmentActivity.create({
    data: {
      departmentId: id,
      activityType: 'HEAD_ASSIGNED',
      description: `${newHeadUser.name} assigned as Head of ${department.name}`,
      performedBy,
    },
  });

  return updatedDept;
};

/**
 * Assign Mentor to Department
 */
export const assignMentor = async (id: string, mentorUserId: string, performedBy: string): Promise<void> => {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) throw new AppError('Department not found', 404);

  const user = await prisma.user.findUnique({ 
    where: { id: mentorUserId },
    include: { mentor: true }
  });
  if (!user || user.role !== UserRole.MENTOR || !user.mentor) {
    throw new AppError('User is not a registered Mentor', 400);
  }

  // Update both User relations and Mentor profile constraints
  await prisma.user.update({
    where: { id: mentorUserId },
    data: { mentorDepartmentId: id },
  });

  await prisma.mentor.update({
    where: { id: user.mentor.id },
    data: { departmentId: id },
  });

  await prisma.departmentActivity.create({
    data: {
      departmentId: id,
      activityType: 'MENTOR_ASSIGNED',
      description: `Mentor ${user.name} assigned to ${department.name}`,
      performedBy,
    },
  });
};

/**
 * Transfer Intern to Department
 */
export const moveIntern = async (id: string, internUserId: string, performedBy: string): Promise<void> => {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) throw new AppError('Department not found', 404);

  const user = await prisma.user.findUnique({ 
    where: { id: internUserId },
    include: { intern: true }
  });
  if (!user || user.role !== UserRole.INTERN || !user.intern) {
    throw new AppError('User is not a registered Intern', 400);
  }

  // Update both User relations and Intern profile constraints
  await prisma.user.update({
    where: { id: internUserId },
    data: { departmentId: id },
  });

  await prisma.intern.update({
    where: { id: user.intern.id },
    data: { departmentId: id },
  });

  await prisma.departmentActivity.create({
    data: {
      departmentId: id,
      activityType: 'INTERN_TRANSFERRED',
      description: `Intern ${user.name} transferred to ${department.name}`,
      performedBy,
    },
  });
};

/**
 * Get Department Analytics (production aggregated counters)
 */
export const getDepartmentAnalytics = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      interns: {
        include: {
          intern: {
            include: {
              onboardingProgress: true,
            },
          },
        },
      },
      mentors: true,
      projects: true,
    },
  });

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  const totalInterns = department.interns.length;
  const totalMentors = department.mentors.length;
  const activeProjects = department.projects.length;

  // Onboarding completion % (APPROVED status means completed)
  const approvedOnboarding = department.interns.filter(
    u => u.intern?.onboardingProgress?.verificationStatus === 'APPROVED'
  ).length;
  const onboardingCompletionRate = totalInterns > 0 ? (approvedOnboarding / totalInterns) * 100 : 0;

  // Average performance score & attendance
  const validScores = department.interns.filter(u => u.intern && u.intern.score > 0);
  const averageScore = validScores.length > 0
    ? validScores.reduce((sum, u) => sum + (u.intern?.score || 0), 0) / validScores.length
    : 0;

  const validAttendance = department.interns.filter(u => u.intern && u.intern.attendance > 0);
  const averageAttendance = validAttendance.length > 0
    ? validAttendance.reduce((sum, u) => sum + (u.intern?.attendance || 0), 0) / validAttendance.length
    : 0;

  // Fetch pending leave request counts for interns in this department
  const pendingLeaves = await prisma.leaveRequest.count({
    where: {
      userId: { in: department.interns.map(u => u.id) },
      status: { startsWith: 'Pending' },
    },
  });

  return {
    statistics: {
      totalInterns,
      totalMentors,
      activeProjects,
      onboardingCompletionRate: Math.round(onboardingCompletionRate * 10) / 10,
      averageScore: Math.round(averageScore * 10) / 10,
      averageAttendance: Math.round(averageAttendance * 10) / 10,
      pendingApprovals: pendingLeaves,
    },
  };
};

/**
 * Get Department Activity Logs
 */
export const getDepartmentActivityLogs = async (departmentId: string) => {
  return prisma.departmentActivity.findMany({
    where: { departmentId },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Fetch Full Company Hierarchy Tree
 */
export const getDepartmentHierarchy = async () => {
  const departments = await prisma.department.findMany({
    include: {
      head: { select: { id: true, name: true, email: true, role: true } },
      mentors: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          mentor: {
            select: {
              interns: {
                select: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      interns: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return departments;
};

/**
 * Simple List Retrieval without Pagination
 */
export const getAllDepartmentsList = async () => {
  return prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      head: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          interns: true,
          mentors: true,
          projects: true,
        },
      },
    },
  });
};
