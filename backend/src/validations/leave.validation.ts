import { z } from 'zod';
import { LeaveType, LeaveStatus } from '@prisma/client';

/**
 * Apply Leave Validation Schema
 */
export const applyLeaveSchema = z.object({
  body: z.object({
    type: z.nativeEnum(LeaveType, {
      errorMap: () => ({ message: 'Leave type must be SICK, CASUAL, EMERGENCY, or OTHER' }),
    }),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid start date format',
    }).transform((val) => new Date(val)),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end date format',
    }).transform((val) => new Date(val)),
    reason: z.string().min(5, 'Reason must be at least 5 characters').max(500, 'Reason must not exceed 500 characters').trim(),
  }),
}).refine((data) => data.body.endDate >= data.body.startDate, {
  message: 'End date must be on or after start date',
  path: ['body.endDate'],
});

/**
 * Reject Leave Validation Schema
 */
export const rejectLeaveSchema = z.object({
  body: z.object({
    rejectionReason: z.string().min(3, 'Rejection reason must be at least 3 characters').max(300, 'Rejection reason must not exceed 300 characters').trim(),
  }),
});

/**
 * Query Params Validation Schema for Leave requests
 */
export const leaveQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    internId: z.string().uuid().optional(),
    status: z.nativeEnum(LeaveStatus).optional(),
    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid start date format',
    }).optional().transform((val) => val ? new Date(val) : undefined),
    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid end date format',
    }).optional().transform((val) => val ? new Date(val) : undefined),
  }),
});
