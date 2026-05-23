import { z } from 'zod';

export const createConversationSchema = z.object({
  body: z.object({
    participantIds: z.array(z.string().uuid(), {
      required_error: 'participantIds must be an array of UUIDs',
    }).min(1, 'At least one participant besides yourself is required'),
    isGroup: z.boolean().optional().default(false),
    name: z.string().min(1, 'Group name cannot be empty').max(100).optional(),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    content: z.string({
      required_error: 'Content is required',
    }).min(1, 'Message content cannot be empty'),
    fileUrl: z.string().url('Invalid file URL').optional(),
    fileName: z.string().min(1).optional(),
    fileType: z.string().min(1).optional(),
    fileSize: z.number().int().positive().optional(),
    metadata: z.any().optional(),
  }),
});

export const interactMessageSchema = z.object({
  body: z.object({
    type: z.enum(['vote', 'rsvp'], {
      required_error: 'Interaction type must be "vote" or "rsvp"',
    }),
    optionId: z.string().optional(),
    status: z.enum(['yes', 'maybe', 'no']).optional(),
  }),
});

export const getMessagesQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
  }),
});
