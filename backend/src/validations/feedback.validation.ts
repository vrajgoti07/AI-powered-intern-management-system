import { z } from 'zod';

export const createFeedbackSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(10, 'Feedback must be at least 10 characters long'),
    category: z.string().optional(),
  }),
});
