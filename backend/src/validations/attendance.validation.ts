import { z } from 'zod';

/**
 * Check-in Validation Schema
 */
export const checkInSchema = z.object({
  body: z.object({
    notes: z.string().max(200, 'Notes must not exceed 200 characters').trim().optional(),
  }),
});

/**
 * Check-out Validation Schema
 */
export const checkOutSchema = z.object({
  body: z.object({
    notes: z.string().max(200, 'Notes must not exceed 200 characters').trim().optional(),
  }),
});

/**
 * Manual Mark Attendance Validation Schema
 */
export const markAttendanceSchema = z.object({
  body: z.object({
    internId: z.string().uuid('Invalid intern ID'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE'], {
      errorMap: () => ({ message: 'Status must be PRESENT, ABSENT, HALF_DAY, or LEAVE' }),
    }),
    notes: z.string().max(200, 'Notes must not exceed 200 characters').trim().optional(),
  }),
});

/**
 * Query Params Validation Schema for Attendance
 */
export const attendanceQuerySchema = z.object({
  query: z.object({
    internId: z.string().uuid('Invalid intern ID').optional(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid start date format',
    }).optional().transform((val) => val ? new Date(val) : undefined),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end date format',
    }).optional().transform((val) => val ? new Date(val) : undefined),
    status: z.string().optional(),
  }),
});
