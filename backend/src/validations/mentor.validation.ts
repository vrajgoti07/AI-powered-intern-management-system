import { z } from 'zod';

/**
 * Create Mentor Validation Schema
 */
export const createMentorSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    departmentId: z.string().uuid('Invalid department ID'),
    expertise: z.array(z.string()).min(1, 'At least one expertise area is required'),
    bio: z.string().optional(),
  }),
});

/**
 * Update Mentor Validation Schema
 */
export const updateMentorSchema = z.object({
  body: z.object({
    departmentId: z.string().uuid().optional(),
    rating: z.number().min(0).max(5).optional(),
    expertise: z.array(z.string()).optional(),
    bio: z.string().optional(),
  }),
});

/**
 * Assign Interns Validation Schema
 */
export const assignInternsSchema = z.object({
  body: z.object({
    internIds: z.array(z.string().uuid()).min(1, 'At least one intern ID is required'),
  }),
});

/**
 * Query Params Validation
 */
export const mentorQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    search: z.string().optional(),
    departmentId: z.string().uuid().optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});
