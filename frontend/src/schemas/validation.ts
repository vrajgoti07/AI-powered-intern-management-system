import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Valid email format is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerUserSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces are allowed'),
  email: z.string().min(1, 'Email is required').email('Valid email is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must have at least 1 uppercase letter')
    .regex(/[0-9]/, 'Password must have at least 1 number')
    .regex(/[^a-zA-Z0-9]/, 'Password must have at least 1 special character'),
  confirmPassword: z.string(),
  role: z.enum(['ADMIN', 'MANAGER', 'INTERN']),
  departmentId: z.string().uuid('Invalid UUID format').optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional(),
  dueDate: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Due date must be a future date',
  }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assignedTo: z.string().uuid('Invalid UUID format for assignment'),
});

export const attendanceSchema = z.object({
  date: z.coerce.date().refine((date) => date <= new Date(), {
    message: 'Date cannot be in the future',
  }),
  status: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY']),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  notes: z.string().max(200, 'Notes cannot exceed 200 characters').optional(),
}).superRefine((data, ctx) => {
  if ((data.status === 'PRESENT' || data.status === 'LATE') && !data.checkIn) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Check-in time is required when present or late',
      path: ['checkIn'],
    });
  }
  
  if (data.checkIn && data.checkOut) {
    // Simple string comparison works for HH:MM format
    if (data.checkOut <= data.checkIn) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Check-out time must be after check-in',
        path: ['checkOut'],
      });
    }
  }
});

export const leaveRequestSchema = z.object({
  leaveType: z.enum(['SICK', 'CASUAL', 'EMERGENCY']),
  startDate: z.coerce.date().refine((date) => date > new Date(), {
    message: 'Start date must be a future date',
  }),
  endDate: z.coerce.date(),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(300, 'Reason cannot exceed 300 characters'),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be on or after start date',
  path: ['endDate'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterUserFormData = z.infer<typeof registerUserSchema>;
export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type AttendanceFormData = z.infer<typeof attendanceSchema>;
export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema>;
