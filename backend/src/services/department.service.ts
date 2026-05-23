import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { PaginatedResponse } from '../types';
import { Department, Prisma } from '@prisma/client';

/**
 * Department with relations type
 */
type DepartmentWithRelations = Prisma.DepartmentGetPayload<{
  include: {
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
    mentors: {
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
  head: string;
  color?: string;
  description?: string;
}): Promise<Department> => {
  // Check if department with same name exists
  const existingDepartment = await prisma.department.findUnique({
    where: { name: data.name },
  });

  if (existingDepartment) {
    throw new AppError('Department with this name already exists', 409);
  }

  // Create department
  const department = await prisma.department.create({
    data: {
      name: data.name,
      head: data.head,
      color: data.color || 'indigo',
      description: data.description,
    },
  });

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
        { head: { contains: search, mode: 'insensitive' } },
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
      mentors: {
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
    data: departments,
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
      mentors: {
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

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  return department;
};

/**
 * Update department
 */
export const updateDepartment = async (
  id: string,
  data: {
    name?: string;
    head?: string;
    color?: string;
    description?: string;
  }
): Promise<Department> => {
  // Check if department exists
  const existingDepartment = await prisma.department.findUnique({
    where: { id },
  });

  if (!existingDepartment) {
    throw new AppError('Department not found', 404);
  }

  // Check if name is being updated and if it conflicts
  if (data.name && data.name !== existingDepartment.name) {
    const nameConflict = await prisma.department.findUnique({
      where: { name: data.name },
    });

    if (nameConflict) {
      throw new AppError('Department with this name already exists', 409);
    }
  }

  // Update department
  const department = await prisma.department.update({
    where: { id },
    data,
  });

  return department;
};

/**
 * Delete department
 */
export const deleteDepartment = async (id: string): Promise<void> => {
  // Check if department exists
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

  // Check if department has interns or mentors
  if (department.interns.length > 0 || department.mentors.length > 0) {
    throw new AppError(
      'Cannot delete department with assigned interns or mentors. Please reassign them first.',
      400
    );
  }

  // Delete department
  await prisma.department.delete({
    where: { id },
  });
};

/**
 * Get department analytics
 */
export const getDepartmentAnalytics = async (id: string) => {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      interns: {
        include: {
          tasks: true,
          feedbacks: true,
        },
      },
      mentors: true,
    },
  });

  if (!department) {
    throw new AppError('Department not found', 404);
  }

  // Calculate analytics
  const totalInterns = department.interns.length;
  const activeInterns = department.interns.filter(i => i.status === 'ACTIVE').length;
  const completedInterns = department.interns.filter(i => i.status === 'COMPLETED').length;
  const totalMentors = department.mentors.length;

  const totalTasks = department.interns.reduce((sum, intern) => sum + intern.tasks.length, 0);
  const completedTasks = department.interns.reduce(
    (sum, intern) => sum + intern.tasks.filter(t => t.status === 'COMPLETED').length,
    0
  );

  const averageScore = totalInterns > 0
    ? department.interns.reduce((sum, intern) => sum + intern.score, 0) / totalInterns
    : 0;

  const averageAttendance = totalInterns > 0
    ? department.interns.reduce((sum, intern) => sum + intern.attendance, 0) / totalInterns
    : 0;

  return {
    department: {
      id: department.id,
      name: department.name,
      head: department.head,
      color: department.color,
    },
    statistics: {
      totalInterns,
      activeInterns,
      completedInterns,
      totalMentors,
      totalTasks,
      completedTasks,
      taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      averageScore: Math.round(averageScore * 100) / 100,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
    },
  };
};

/**
 * Get all departments (simple list without pagination)
 */
export const getAllDepartmentsList = async () => {
  const departments = await prisma.department.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          interns: true,
          mentors: true,
        }
      }
    }
  });

  return departments;
};
