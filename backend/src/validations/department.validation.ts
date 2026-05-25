import { z } from 'zod';

/**
 * Create Department Validation Schema
 */
export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Department name must be at least 2 characters'),
    code: z.string().min(2, 'Code must be at least 2 characters').max(10, 'Code cannot exceed 10 characters').toUpperCase(),
    color: z.string().regex(/^[a-z]+$/, 'Color must be a valid color name').default('indigo'),
    description: z.string().optional(),
    headId: z.string().uuid('Invalid Department Head user ID').optional().nullable(),
  }),
});

/**
 * Update Department Validation Schema
 */
export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string().min(2).max(10).toUpperCase().optional(),
    color: z.string().regex(/^[a-z]+$/).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
    headId: z.string().uuid('Invalid Department Head user ID').optional().nullable(),
  }),
});

/**
 * Assign Department Head Schema
 */
export const assignHeadSchema = z.object({
  body: z.object({
    headId: z.string().uuid('Invalid Department Head user ID'),
  }),
});

/**
 * Assign Department Head Patch Schema
 */
export const assignHeadPatchSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid Department Head user ID'),
  }),
});

/**
 * Assign Mentor Schema
 */
export const assignMentorSchema = z.object({
  body: z.object({
    mentorId: z.string().uuid('Invalid Mentor user ID'), // Expecting User.id
  }),
});

/**
 * Move Intern Schema
 */
export const moveInternSchema = z.object({
  body: z.object({
    internId: z.string().uuid('Invalid Intern user ID'), // Expecting User.id
  }),
});

/**
 * Query Params Validation
 */
export const departmentQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    search: z.string().optional(),
    sortBy: z.string().optional().default('name'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),
});
