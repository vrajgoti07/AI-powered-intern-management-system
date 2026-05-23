import { z } from 'zod';

/**
 * Create Department Validation Schema
 */
export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Department name must be at least 2 characters'),
    head: z.string().min(2, 'Department head name must be at least 2 characters'),
    color: z.string().regex(/^[a-z]+$/, 'Color must be a valid color name').default('indigo'),
    description: z.string().optional(),
  }),
});

/**
 * Update Department Validation Schema
 */
export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    head: z.string().min(2).optional(),
    color: z.string().regex(/^[a-z]+$/).optional(),
    description: z.string().optional(),
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
