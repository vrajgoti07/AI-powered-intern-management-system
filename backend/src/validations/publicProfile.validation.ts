import { z } from 'zod';

/**
 * Validation schema for updating public profile settings.
 * All fields are optional — only include the ones being changed.
 */
export const updatePublicSettingsSchema = z.object({
  body: z.object({
    isPublic: z.boolean().optional(),
    showSkills: z.boolean().optional(),
    showTasks: z.boolean().optional(),
    showFeedbackScore: z.boolean().optional(),
    showPerformanceGrade: z.boolean().optional(),
    showAttendance: z.boolean().optional(),
    showMentorName: z.boolean().optional(),
    showCollege: z.boolean().optional(),
    customBio: z
      .string()
      .max(300, 'Custom bio must be 300 characters or fewer')
      .nullable()
      .optional(),
  }),
});
