import { z } from 'zod';

export const matchRoleSchema = z.object({
  body: z.object({
    skills: z.array(z.string().min(1)).min(1, 'At least one skill is required'),
    interests: z.array(z.string().min(1)).min(1, 'At least one interest is required'),
    education: z.string().min(1, 'Education background is required'),
    departmentRequirements: z.array(
      z.object({
        name: z.string().min(1, 'Department name is required'),
        role: z.string().min(1, 'Role name is required'),
        required_skills: z.array(z.string()),
        preferred_interests: z.array(z.string()),
      })
    ).min(1, 'At least one department requirement is required'),
  }),
});

export const predictPerformanceSchema = z.object({
  body: z.object({
    attendanceRate: z.number().min(0).max(1, 'Attendance rate must be between 0 and 1'),
    taskCompletionRate: z.number().min(0).max(1, 'Task completion rate must be between 0 and 1'),
    feedbackSentimentScore: z.number().min(-1).max(1, 'Sentiment score must be between -1 and 1'),
    productivityScore: z.number().min(0).max(1, 'Productivity score must be between 0 and 1'),
  }),
});

export const sentimentAnalysisSchema = z.object({
  body: z.object({
    feedbackText: z.string().min(1, 'Feedback text cannot be empty'),
  }),
});

export const chatbotSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message cannot be empty'),
    history: z.array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    ).optional(),
    context: z.record(z.any()).optional(),
  }),
});
