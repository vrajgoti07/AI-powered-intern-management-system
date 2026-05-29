import { Request, Response, NextFunction } from 'express';
import taskService from '../services/task.service';
import { TaskPriority } from '@prisma/client';
import notificationService from '../services/notification.service';
import prisma from '../config/database';
import { getSocketIO } from '../socket/socket';

export class TaskController {
  /**
   * Create a new task
   */
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, internId, priority, dueDate } = req.body;
      const mentorId = req.user?.mentor?.id;

      if (!mentorId) {
        res.status(403).json({
          success: false,
          message: 'Only mentors can create tasks',
        });
        return;
      }

      const task = await taskService.createTask({
        title,
        description,
        internId,
        mentorId,
        priority: priority as TaskPriority,
        dueDate: new Date(dueDate),
      });

      // Notify the intern about the new task assignment
      const internUser = await prisma.intern.findUnique({
        where: { id: internId },
        select: { 
          userId: true,
          user: { select: { name: true } }
        },
      });
      if (internUser?.userId) {
        await notificationService.createNotification(
          internUser.userId,
          'New Task Assigned',
          `You have been assigned a new task: "${task.title}".`,
          'TASK',
          { taskId: task.id },
          true,
          `New Task: ${task.title}`
        );
      }

      // Notify all HR administrators
      const internName = internUser?.user?.name || 'An intern';
      await notificationService.notifyHR(
        'New Task Assigned',
        `Mentor ${req.user!.name} assigned a new task "${task.title}" to intern ${internName}.`,
        'TASK',
        { taskId: task.id, internId }
      );

      const io = getSocketIO();
      if (io && internUser?.userId) {
        io.to(`user:${internUser.userId}`).emit('task:assigned', {
          taskId: task.id,
          title: task.title,
          dueDate: task.dueDate,
          assignedBy: req.user!.name
        });
      }

      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all tasks
   */
  async getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, sortBy, sortOrder, internId, mentorId, status, priority, search, departmentId, assignedTo } = req.query;

      // Build filters based on user role
      const filters: any = {};

      if (req.user?.role === 'INTERN' || assignedTo === 'me') {
        filters.internId = req.user.intern?.id;
      } else if (req.user?.role === 'MENTOR') {
        filters.mentorId = req.user.mentor?.id;
      } else if (req.user?.role === 'DEPARTMENT_HEAD') {
        if (req.user.headedDepartment?.id) {
          filters.departmentId = req.user.headedDepartment.id;
        }
      }

      // Override with query params if provided (for HR)
      if (internId) filters.internId = internId as string;
      if (mentorId) filters.mentorId = mentorId as string;
      if (departmentId) filters.departmentId = departmentId as string;
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (search) filters.search = search as string;

      const result = await taskService.getTasks(filters, {
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
        sortBy: (sortBy as string) || 'createdAt',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      });

      res.status(200).json({
        success: true,
        message: 'Tasks retrieved successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const task = await taskService.getTaskById(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      // Check authorization
      if (req.user?.role === 'INTERN' && task.internId !== req.user.intern?.id) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to view this task',
        });
        return;
      }

      if (req.user?.role === 'MENTOR' && task.mentorId !== req.user.mentor?.id) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to view this task',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Task retrieved successfully',
        data: task,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update task
   */
  async updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { title, description, priority, status, dueDate } = req.body;

      const task = await taskService.getTaskById(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      // INTERN guard: can only update status on their own assigned task
      if (req.user?.role === 'INTERN') {
        if (task.internId !== req.user.intern?.id) {
          res.status(403).json({
            success: false,
            message: 'Unauthorized: You can only update your own tasks',
          });
          return;
        }

        // Interns cannot set status to COMPLETED (that's mentor-only)
        if (status === 'COMPLETED') {
          res.status(403).json({
            success: false,
            message: 'Only mentors can mark tasks as completed',
          });
          return;
        }

        // Interns can only change the status field
        const updatedTask = await taskService.updateTask(id, { status });

        // Notify mentor when intern starts a task
        if (status === 'IN_PROGRESS' || status === 'REVIEW') {
          const mentorUser = await prisma.mentor.findUnique({
            where: { id: task.mentorId },
            select: { userId: true },
          });
          if (mentorUser?.userId) {
            const statusLabel = status === 'IN_PROGRESS' ? 'started working on' : 'submitted for review';
            await notificationService.createNotification(
              mentorUser.userId,
              status === 'IN_PROGRESS' ? 'Task Started' : 'Task Submitted for Review',
              `${req.user!.name} has ${statusLabel} the task: "${task.title}".`,
              'TASK',
              { taskId: task.id },
              true,
              `Task Update: ${task.title}`
            );
          }

          // Notify HR
          await notificationService.notifyHR(
            status === 'IN_PROGRESS' ? 'Task Started' : 'Task Submitted for Review',
            `Intern ${req.user!.name} has ${status === 'IN_PROGRESS' ? 'started' : 'submitted'} the task "${task.title}".`,
            'TASK',
            { taskId: task.id, internId: task.internId }
          );
        }

        const io = getSocketIO();
        if (io) {
          // Emit to intern
          io.to(`user:${req.user!.id}`).emit('task:updated', { taskId: updatedTask.id, status: updatedTask.status });
          
          // Emit to mentor
          const mentorUser = await prisma.mentor.findUnique({ where: { id: task.mentorId }, select: { userId: true } });
          if (mentorUser?.userId) {
            io.to(`user:${mentorUser.userId}`).emit('task:updated', { taskId: updatedTask.id, status: updatedTask.status });
          }
        }

        res.status(200).json({
          success: true,
          message: 'Task status updated successfully',
          data: updatedTask,
        });
        return;
      }

      // MENTOR path: full update authorization
      if (req.user?.role === 'MENTOR' && task.mentorId !== req.user.mentor?.id) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to update this task',
        });
        return;
      }

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (priority) updateData.priority = priority;
      if (status) updateData.status = status;
      if (dueDate) updateData.dueDate = new Date(dueDate);

      const updatedTask = await taskService.updateTask(id, updateData);

      // Notify the intern about the task details update
      const internUser = await prisma.intern.findUnique({
        where: { id: updatedTask.internId },
        select: { 
          userId: true,
          user: { select: { name: true } }
        },
      });
      if (internUser?.userId) {
        const isCompleted = updatedTask.status === 'COMPLETED';
        await notificationService.createNotification(
          internUser.userId,
          isCompleted ? 'Task Approved & Completed' : 'Task Updated',
          isCompleted
            ? `Congratulations! Your submitted task "${updatedTask.title}" has been reviewed and marked as COMPLETED.`
            : `Your assigned task "${updatedTask.title}" has been updated.`,
          'TASK',
          { taskId: updatedTask.id },
          isCompleted ? true : undefined,
          isCompleted ? `Task Completed: ${updatedTask.title}` : undefined
        );
      }

      // Notify all HR administrators if marked as COMPLETED
      if (updatedTask.status === 'COMPLETED') {
        const internName = internUser?.user?.name || 'An intern';
        await notificationService.notifyHR(
          'Task Approved & Completed',
          `Mentor ${req.user!.name} has approved and marked the task "${updatedTask.title}" as COMPLETED for intern ${internName}.`,
          'TASK',
          { taskId: updatedTask.id }
        );
      }

      const io = getSocketIO();
      if (io) {
        if (internUser?.userId) {
          io.to(`user:${internUser.userId}`).emit('task:updated', { taskId: updatedTask.id, status: updatedTask.status });
        }
        io.to(`user:${req.user!.id}`).emit('task:updated', { taskId: updatedTask.id, status: updatedTask.status });
      }

      res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete task
   */
  async deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const task = await taskService.getTaskById(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      // Check authorization
      if (req.user?.role === 'MENTOR' && task.mentorId !== req.user.mentor?.id) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to delete this task',
        });
        return;
      }

      await taskService.deleteTask(id);

      res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit task
   */
  async submitTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { submissionNotes } = req.body;

      const task = await taskService.getTaskById(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      // Check authorization
      if (task.internId !== req.user?.intern?.id) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to submit this task',
        });
        return;
      }

      const submissionUrl = req.file ? req.file.path : undefined;

      const updatedTask = await taskService.submitTask(id, {
        submissionUrl,
        submissionNotes,
      });

      // Notify the mentor about the task submission
      const mentorUser = await prisma.mentor.findUnique({
        where: { id: task.mentorId },
        select: { userId: true },
      });
      if (mentorUser?.userId) {
        await notificationService.createNotification(
          mentorUser.userId,
          'Task Submitted',
          `${req.user!.name} has submitted the task: "${task.title}".`,
          'TASK',
          { taskId: task.id },
          true,
          `Task Submission: ${task.title}`
        );
      }

      // Notify all HR administrators
      await notificationService.notifyHR(
        'Task Submitted',
        `Intern ${req.user!.name} has submitted the task: "${task.title}".`,
        'TASK',
        { taskId: task.id, internId: task.internId }
      );


      res.status(200).json({
        success: true,
        message: 'Task submitted successfully',
        data: updatedTask,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload task file
   */
  async uploadTaskFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded',
        });
        return;
      }

      const task = await taskService.getTaskById(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      const file = await taskService.addTaskFile(id, {
        fileName: req.file.originalname,
        fileUrl: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user!.id,
      });

      res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: file,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get task files
   */
  async getTaskFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const files = await taskService.getTaskFiles(id);

      res.status(200).json({
        success: true,
        message: 'Task files retrieved successfully',
        data: files,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add task comment
   */
  async addTaskComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;
      const { comment } = req.body;

      const task = await taskService.getTaskById(id);

      if (!task) {
        res.status(404).json({
          success: false,
          message: 'Task not found',
        });
        return;
      }

      const taskComment = await taskService.addTaskComment(id, req.user!.id, comment);

      // Notify the other party about the new task comment
      if (req.user?.role === 'INTERN') {
        const mentorUser = await prisma.mentor.findUnique({
          where: { id: task.mentorId },
          select: { userId: true },
        });
        if (mentorUser?.userId) {
          await notificationService.createNotification(
            mentorUser.userId,
            'New Task Comment',
            `${req.user!.name} commented on task: "${task.title}".`,
            'TASK',
            { taskId: task.id }
          );
        }
      } else {
        const internUser = await prisma.intern.findUnique({
          where: { id: task.internId },
          select: { userId: true },
        });
        if (internUser?.userId) {
          await notificationService.createNotification(
            internUser.userId,
            'New Task Comment',
            `${req.user!.name} commented on task: "${task.title}".`,
            'TASK',
            { taskId: task.id }
          );
        }
      }

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: taskComment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get task comments
   */
  async getTaskComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id as string;

      const comments = await taskService.getTaskComments(id);

      res.status(200).json({
        success: true,
        message: 'Task comments retrieved successfully',
        data: comments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get task analytics
   */
  async getTaskAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internId, mentorId, departmentId } = req.query;

      const filters: any = {};

      // Apply filters based on user role
      if (req.user?.role === 'INTERN') {
        filters.internId = req.user.intern?.id;
      } else if (req.user?.role === 'MENTOR') {
        filters.mentorId = req.user.mentor?.id;
      }

      // Override with query params if provided (for HR)
      if (internId) filters.internId = internId as string;
      if (mentorId) filters.mentorId = mentorId as string;
      if (departmentId) filters.departmentId = departmentId as string;

      const analytics = await taskService.getTaskAnalytics(filters);

      res.status(200).json({
        success: true,
        message: 'Task analytics retrieved successfully',
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
