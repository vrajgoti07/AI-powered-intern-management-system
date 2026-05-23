import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

/**
 * Get HR Dashboard Analytics
 */
export const getHRDashboard = async () => {
  // Get counts
  const totalInterns = await prisma.intern.count();
  const activeInterns = await prisma.intern.count({ where: { status: 'ACTIVE' } });
  const completedInterns = await prisma.intern.count({ where: { status: 'COMPLETED' } });
  const pendingInterns = await prisma.intern.count({ where: { status: 'PENDING' } });

  const totalMentors = await prisma.mentor.count();
  const totalDepartments = await prisma.department.count();
  const totalTasks = await prisma.task.count();
  const completedTasks = await prisma.task.count({ where: { status: 'COMPLETED' } });

  // Get average scores and attendance
  const interns = await prisma.intern.findMany({
    select: { score: true, attendance: true },
  });

  const averageScore = interns.length > 0
    ? interns.reduce((sum, intern) => sum + intern.score, 0) / interns.length
    : 0;

  const averageAttendance = interns.length > 0
    ? interns.reduce((sum, intern) => sum + intern.attendance, 0) / interns.length
    : 0;

  // Get department-wise statistics
  const departments = await prisma.department.findMany({
    include: {
      interns: true,
      mentors: true,
    },
  });

  const departmentStats = departments.map(dept => ({
    id: dept.id,
    name: dept.name,
    color: dept.color,
    totalInterns: dept.interns.length,
    activeInterns: dept.interns.filter(i => i.status === 'ACTIVE').length,
    totalMentors: dept.mentors.length,
  }));

  // Get recent interns
  const recentInterns = await prisma.intern.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
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
  });

  // Get task statistics
  const taskStats = {
    total: totalTasks,
    completed: completedTasks,
    inProgress: await prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    review: await prisma.task.count({ where: { status: 'REVIEW' } }),
    todo: await prisma.task.count({ where: { status: 'TODO' } }),
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
  };

  return {
    overview: {
      totalInterns,
      activeInterns,
      completedInterns,
      pendingInterns,
      totalMentors,
      totalDepartments,
      averageScore: Math.round(averageScore * 100) / 100,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
    },
    taskStats,
    departmentStats,
    recentInterns,
  };
};

/**
 * Get all users with filters
 */
export const getAllUsers = async (filters?: {
  role?: string;
  isActive?: boolean;
  search?: string;
}) => {
  const where: any = {};

  if (filters?.role) {
    where.role = filters.role;
  }

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      lastLogin: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
};

/**
 * Get intern statistics
 */
export const getInternStatistics = async () => {
  const total = await prisma.intern.count();
  const active = await prisma.intern.count({ where: { status: 'ACTIVE' } });
  const completed = await prisma.intern.count({ where: { status: 'COMPLETED' } });
  const pending = await prisma.intern.count({ where: { status: 'PENDING' } });

  // Get interns by department
  const departments = await prisma.department.findMany({
    include: {
      interns: true,
    },
  });

  const byDepartment = departments.map(dept => ({
    department: dept.name,
    count: dept.interns.length,
    active: dept.interns.filter(i => i.status === 'ACTIVE').length,
  }));

  // Get top performers
  const topPerformers = await prisma.intern.findMany({
    take: 10,
    orderBy: { score: 'desc' },
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
  });

  return {
    total,
    active,
    completed,
    pending,
    byDepartment,
    topPerformers,
  };
};

/**
 * Get mentor statistics
 */
export const getMentorStatistics = async () => {
  const total = await prisma.mentor.count();

  // Get mentors with intern counts
  const mentors = await prisma.mentor.findMany({
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
      interns: true,
    },
  });

  const mentorStats = mentors.map(mentor => ({
    id: mentor.id,
    name: mentor.user.name,
    email: mentor.user.email,
    department: mentor.department.name,
    totalInterns: mentor.interns.length,
    rating: mentor.rating,
  }));

  // Get mentors by department
  const departments = await prisma.department.findMany({
    include: {
      mentors: true,
    },
  });

  const byDepartment = departments.map(dept => ({
    department: dept.name,
    count: dept.mentors.length,
  }));

  return {
    total,
    mentorStats,
    byDepartment,
  };
};

/**
 * Bulk update user status
 */
export const bulkUpdateUserStatus = async (
  userIds: string[],
  isActive: boolean
): Promise<number> => {
  const result = await prisma.user.updateMany({
    where: { id: { in: userIds } },
    data: { isActive },
  });

  return result.count;
};

/**
 * Delete user (HR only)
 */
export const deleteUser = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Delete user (cascade will handle related records)
  await prisma.user.delete({
    where: { id: userId },
  });
};
