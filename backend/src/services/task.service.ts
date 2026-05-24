import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';
import { PaginationQuery, PaginatedResponse } from '../types';

const prisma = new PrismaClient();

interface CreateTaskData {
  title: string;
  description: string;
  internId: string;
  mentorId: string;
  priority: TaskPriority;
  dueDate: Date;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date;
}

interface SubmitTaskData {
  submissionUrl?: string;
  submissionNotes?: string;
}

interface TaskFilterOptions {
  internId?: string;
  mentorId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  departmentId?: string;
}

export class TaskService {
  /**
   * Create a new task
   */
  async createTask(data: CreateTaskData) {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        internId: data.internId,
        mentorId: data.mentorId,
        priority: data.priority,
        dueDate: data.dueDate,
      },
      include: {
        intern: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return task;
  }

  /**
   * Get all tasks with filters and pagination
   */
  async getTasks(
    filters: TaskFilterOptions,
    pagination: PaginationQuery
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.internId) {
      where.internId = filters.internId;
    }

    if (filters.mentorId) {
      where.mentorId = filters.mentorId;
    }

    if (filters.departmentId) {
      where.intern = {
        departmentId: filters.departmentId,
      };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.priority) {
      where.priority = filters.priority;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.task.count({ where });

    // Get tasks
    const tasks = await prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        intern: {
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
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return {
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        intern: {
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
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return task;
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, data: UpdateTaskData) {
    const task = await prisma.task.update({
      where: { id: taskId },
      data,
      include: {
        intern: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return task;
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string) {
    // Delete associated comments and files first
    await prisma.taskComment.deleteMany({
      where: { taskId },
    });

    await prisma.taskFile.deleteMany({
      where: { taskId },
    });

    // Delete the task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return { message: 'Task deleted successfully' };
  }

  /**
   * Submit task
   */
  async submitTask(taskId: string, data: SubmitTaskData) {
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.REVIEW,
        submissionUrl: data.submissionUrl,
        submissionNotes: data.submissionNotes,
        submittedAt: new Date(),
      },
      include: {
        intern: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        mentor: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return task;
  }

  /**
   * Add task file
   */
  async addTaskFile(taskId: string, fileData: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
  }) {
    const file = await prisma.taskFile.create({
      data: {
        taskId,
        ...fileData,
      },
    });

    return file;
  }

  /**
   * Get task files
   */
  async getTaskFiles(taskId: string) {
    const files = await prisma.taskFile.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    return files;
  }

  /**
   * Delete task file
   */
  async deleteTaskFile(fileId: string) {
    await prisma.taskFile.delete({
      where: { id: fileId },
    });

    return { message: 'File deleted successfully' };
  }

  /**
   * Add task comment
   */
  async addTaskComment(taskId: string, userId: string, comment: string) {
    const taskComment = await prisma.taskComment.create({
      data: {
        taskId,
        userId,
        comment,
      },
    });

    return taskComment;
  }

  /**
   * Get task comments
   */
  async getTaskComments(taskId: string) {
    const comments = await prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }

  /**
   * Get task analytics
   */
  async getTaskAnalytics(filters: { internId?: string; mentorId?: string; departmentId?: string }) {
    const where: any = {};

    if (filters.internId) {
      where.internId = filters.internId;
    }

    if (filters.mentorId) {
      where.mentorId = filters.mentorId;
    }

    if (filters.departmentId) {
      where.intern = {
        departmentId: filters.departmentId,
      };
    }

    // Get task counts by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    // Get task counts by priority
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where,
      _count: {
        id: true,
      },
    });

    // Get overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        ...where,
        dueDate: {
          lt: new Date(),
        },
        status: {
          notIn: [TaskStatus.COMPLETED],
        },
      },
    });

    // Get completion rate
    const totalTasks = await prisma.task.count({ where });
    const completedTasks = await prisma.task.count({
      where: {
        ...where,
        status: TaskStatus.COMPLETED,
      },
    });

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      tasksByStatus: tasksByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      tasksByPriority: tasksByPriority.map((item) => ({
        priority: item.priority,
        count: item._count.id,
      })),
      overdueTasks,
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }
}

export default new TaskService();
