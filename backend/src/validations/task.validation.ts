import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

/**
 * Create Task Validation Schema
 */
export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must not exceed 100 characters').trim(),
    description: z.string().min(5, 'Description must be at least 5 characters').trim(),
    internId: z.string().uuid('Invalid intern ID'),
    priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid due date format',
    }),
  }),
});

/**
 * Update Task Validation Schema
 */
export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).trim().optional(),
    description: z.string().min(5).trim().optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid due date format',
    }).optional(),
  }),
});

/**
 * Task Comment Validation Schema
 */
export const taskCommentSchema = z.object({
  body: z.object({
    comment: z.string().min(1, 'Comment text cannot be empty').trim(),
  }),
});

/**
 * Submit Task Validation Schema
 */
export const submitTaskSchema = z.object({
  body: z.object({
    submissionNotes: z.string().min(5, 'Submission notes must be at least 5 characters').trim().optional(),
  }),
});

/**
 * Query Params Validation Schema for Tasks
 */
export const taskQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    internId: z.string().uuid().optional(),
    mentorId: z.string().uuid().optional(),
    status: z.nativeEnum(TaskStatus).optional(),
    priority: z.nativeEnum(TaskPriority).optional(),
    search: z.string().optional(),
    assignedTo: z.string().optional(),
    departmentId: z.string().uuid().optional(),
  }),
});
