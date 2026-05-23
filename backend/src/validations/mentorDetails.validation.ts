import { z } from 'zod';

/**
 * Update Mentor Profile Validation Schema
 */
export const updateMentorProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional().nullable(),
    departmentId: z.string().uuid().optional(),
    designation: z.string().max(100).optional().nullable(),
    experience: z.number().int().min(0).max(50).optional(),
    skills: z.array(z.string()).optional(),
    expertise: z.array(z.string()).optional(),
    bio: z.string().max(2000).optional().nullable(),
    mentorCapacity: z.number().int().min(1).max(20).optional(),
    mentorStatus: z.enum(['ACTIVE', 'ON_LEAVE', 'INACTIVE']).optional(),
    rating: z.number().min(0).max(5).optional(),
  }),
});

/**
 * Assign Intern to Mentor Validation Schema
 */
export const assignInternToMentorSchema = z.object({
  body: z.object({
    internId: z.string().uuid('Invalid intern ID'),
  }),
});

/**
 * Activity Timeline Query Params
 */
export const activityQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
    activityType: z.string().optional(),
  }),
});

/**
 * Document Upload Validation (for query/body params, file handled by multer)
 */
export const documentUploadSchema = z.object({
  body: z.object({
    fileType: z.enum(['resume', 'certificate', 'id_proof', 'offer_letter', 'performance_report']).optional().default('certificate'),
  }),
});
