import { z } from 'zod';
import { InternStatus } from '@prisma/client';

/**
 * Public Candidate Apply Validation Schema
 */
export const applyInternSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    dob: z.string().optional(),
    college: z.string().min(2, 'College name must be at least 2 characters'),
    degree: z.string().optional(),
    branch: z.string().optional(),
    cgpa: z.number().min(0).max(10).optional(),
    dept: z.string().optional(),
    skills: z.array(z.string()).default([]),
    duration: z.string().optional(),
    startDate: z.string().optional(),
    whyJoin: z.string().optional(),
  }),
});

/**
 * Create Intern Validation Schema
 */
export const createInternSchema = z.object({
  body: z.object({
    userId: z.string().uuid('Invalid user ID'),
    phone: z.string().optional(),
    dob: z.string().datetime().optional(),
    college: z.string().min(2, 'College name must be at least 2 characters'),
    degree: z.string().optional(),
    branch: z.string().optional(),
    cgpa: z.number().min(0).max(10).optional(),
    departmentId: z.string().uuid('Invalid department ID'),
    mentorId: z.string().uuid('Invalid mentor ID').optional(),
    skills: z.array(z.string()).default([]),
    duration: z.string().optional(),
    startDate: z.string().datetime().optional(),
    whyJoin: z.string().optional(),
    resumeUrl: z.string().url('Invalid resume URL').optional(),
  }),
});

/**
 * Update Intern Validation Schema
 */
export const updateInternSchema = z.object({
  body: z.object({
    phone: z.string().optional(),
    dob: z.string().optional(),
    college: z.string().min(2).optional(),
    degree: z.string().optional(),
    branch: z.string().optional(),
    cgpa: z.number().min(0).max(10).optional(),
    departmentId: z.string().uuid().optional(),
    mentorId: z.string().uuid().optional().nullable(),
    status: z.nativeEnum(InternStatus).optional(),
    score: z.number().min(0).max(100).optional(),
    attendance: z.number().min(0).max(100).optional(),
    skills: z.array(z.string()).optional(),
    duration: z.string().optional(),
    startDate: z.string().datetime().optional(),
    completedDate: z.string().datetime().optional().nullable(),
    whyJoin: z.string().optional(),
    resumeUrl: z.string().url().optional().nullable(),
    gender: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    workAddress: z.string().optional().nullable(),
    parentName: z.string().optional().nullable(),
    parentPhone: z.string().optional().nullable(),
    emergencyName: z.string().optional().nullable(),
    emergencyPhone: z.string().optional().nullable(),
    emergencyRelation: z.string().optional().nullable(),
    semester: z.number().optional().nullable(),
    experience: z.any().optional(),
    education: z.any().optional(),
  }),
});

/**
 * Assign Mentor Validation Schema
 */
export const assignMentorSchema = z.object({
  body: z.object({
    mentorId: z.string().uuid('Invalid mentor ID'),
  }),
});

/**
 * Update Skills Validation Schema
 */
export const updateSkillsSchema = z.object({
  body: z.object({
    skills: z.array(z.string()).min(1, 'At least one skill is required'),
  }),
});

/**
 * Query Params Validation
 */
export const internQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    search: z.string().optional(),
    status: z.nativeEnum(InternStatus).optional(),
    departmentId: z.string().uuid().optional(),
    mentorId: z.string().uuid().optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});
