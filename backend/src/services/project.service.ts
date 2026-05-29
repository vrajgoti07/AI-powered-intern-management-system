import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

/**
 * Create a new department project
 */
export const createProject = async (departmentId: string, data: {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const department = await prisma.department.findUnique({ where: { id: departmentId } });
  if (!department) throw new AppError('Department not found', 404);

  return prisma.project.create({
    data: {
      title: data.title,
      description: data.description,
      departmentId,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      status: 'ACTIVE',
    },
  });
};

/**
 * Get projects by department ID
 */
export const getProjectsByDepartment = async (departmentId: string) => {
  const projects = await prisma.project.findMany({
    where: { departmentId },
    include: {
      interns: {
        include: {
          intern: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return projects.map(p => {
    // Calculate simple completion percentage based on tasks? 
    // The prompt says "completion percentage". Since Project doesn't relate directly to Tasks in schema,
    // we'll return 0 or calculate based on intern tasks if they were linked. For now, mock or leave 0.
    return {
      ...p,
      completionPercentage: p.status === 'COMPLETED' ? 100 : 0,
    };
  });
};

/**
 * Update project details
 */
export const updateProject = async (projectId: string, data: {
  title?: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError('Project not found', 404);

  return prisma.project.update({
    where: { id: projectId },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
  });
};

/**
 * Assign intern to project
 */
export const assignInternToProject = async (projectId: string, internId: string, role: string = 'MEMBER') => {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new AppError('Project not found', 404);

  const internUser = await prisma.user.findUnique({ where: { id: internId }, include: { intern: true } });
  if (!internUser || !internUser.intern) throw new AppError('Intern not found', 404);

  const existingAssignment = await prisma.internProject.findUnique({
    where: {
      internId_projectId: {
        internId: internUser.intern.id,
        projectId,
      }
    }
  });

  if (existingAssignment) {
    throw new AppError('Intern is already assigned to this project', 400);
  }

  return prisma.internProject.create({
    data: {
      internId: internUser.intern.id,
      projectId,
      role,
    },
    include: {
      intern: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } }
        }
      }
    }
  });
};
