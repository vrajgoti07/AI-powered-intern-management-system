import { z } from 'zod';

// ==================== TASK VALIDATION ====================

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    internId: z.string().uuid('Invalid intern ID'),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
    dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }),
  }),
});

export const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }).optional(),
  }),
});

export const submitTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
  body: z.object({
    submissionNotes: z.string().optional(),
  }),
});

export const taskCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid task ID'),
  }),
  body: z.object({
    comment: z.string().min(1, 'Comment cannot be empty').max(1000),
  }),
});

// ==================== ATTENDANCE VALIDATION ====================

export const checkInSchema = z.object({
  body: z.object({
    notes: z.string().max(500).optional(),
  }),
});

export const checkOutSchema = z.object({
  body: z.object({
    notes: z.string().max(500).optional(),
  }),
});

export const attendanceQuerySchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    internId: z.string().uuid().optional(),
    status: z.enum(['PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE']).optional(),
  }),
});

// ==================== LEAVE VALIDATION ====================

export const applyLeaveSchema = z.object({
  body: z.object({
    type: z.enum(['SICK', 'CASUAL', 'EMERGENCY', 'OTHER']),
    startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid start date format',
    }),
    endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid end date format',
    }),
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  }).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  }, {
    message: 'End date must be after or equal to start date',
  }),
});

export const approveLeaveSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid leave ID'),
  }),
});

export const rejectLeaveSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid leave ID'),
  }),
  body: z.object({
    rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters').max(500),
  }),
});

export const leaveQuerySchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    internId: z.string().uuid().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

// ==================== ANALYTICS VALIDATION ====================

export const analyticsQuerySchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    internId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type SubmitTaskInput = z.infer<typeof submitTaskSchema>;
export type TaskCommentInput = z.infer<typeof taskCommentSchema>;
export type CheckInInput = z.infer<typeof checkInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;
export type ApproveLeaveInput = z.infer<typeof approveLeaveSchema>;
export type RejectLeaveInput = z.infer<typeof rejectLeaveSchema>;
export type LeaveQueryInput = z.infer<typeof leaveQuerySchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
