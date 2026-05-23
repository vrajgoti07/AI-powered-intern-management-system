import { z } from 'zod';

/**
 * Validation schema for analytics query filters
 * Validates optional query parameters: startDate, endDate, departmentId, internId, mentorId
 */
export const analyticsQuerySchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    departmentId: z.string().uuid('Invalid department ID format').optional(),
    internId: z.string().uuid('Invalid intern ID format').optional(),
    mentorId: z.string().uuid('Invalid mentor ID format').optional(),
  }),
});

/**
 * Validation schema for report queries requiring an internId
 */
export const reportQuerySchema = z.object({
  query: z.object({
    internId: z.string().uuid('Intern ID is required and must be a valid UUID'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

/**
 * Validation schema for PDF export queries
 * type: 'attendance' | 'performance' | 'completion' | 'summary'
 */
export const exportPdfQuerySchema = z.object({
  query: z.object({
    type: z.enum(['attendance', 'performance', 'completion', 'summary'], {
      errorMap: () => ({ message: 'Export type must be one of: attendance, performance, completion, summary' }),
    }),
    internId: z.string().uuid('Intern ID must be a valid UUID').optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

/**
 * Validation schema for Excel export queries
 * type: 'attendance' | 'tasks' | 'departments'
 */
export const exportExcelQuerySchema = z.object({
  query: z.object({
    type: z.enum(['attendance', 'tasks', 'departments'], {
      errorMap: () => ({ message: 'Export type must be one of: attendance, tasks, departments' }),
    }),
    internId: z.string().uuid('Intern ID must be a valid UUID').optional(),
    departmentId: z.string().uuid('Department ID must be a valid UUID').optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});
