import { z } from 'zod';
import { InternStatus } from '@prisma/client';

/**
 * Public Candidate Apply Validation Schema
 */
export const applyInternSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string()
      .min(1, 'Email is required.')
      .email('Please enter a valid email address.')
      .refine((val) => {
        // Block all disposable / fake / placeholder domains
        const blockedDomains = [
          'example.com', 'example.org', 'example.net',
          'test.com', 'test.org', 'test.net',
          'fake.com', 'fake.org',
          'mailinator.com', 'guerrillamail.com', 'guerrillamail.org',
          'guerrillamail.net', 'guerrillamail.biz', 'guerrillamail.de',
          'trashmail.com', 'trashmail.net', 'trashmail.org',
          'yopmail.com', 'yopmail.fr', 'cool.fr.nf',
          'jetable.fr.nf', 'nospam.ze.tc', 'nomail.xl.cx',
          'mega.zik.dj', 'speed.1s.fr', 'courriel.fr.nf',
          'moncourrier.fr.nf', 'monemail.fr.nf', 'monmail.fr.nf',
          'dispostable.com', 'spamgourmet.com', 'spamgourmet.org',
          'spamgourmet.net', 'trashmail.at', 'trashmail.io',
          'throwam.com', 'throwaway.email', 'filzmail.com',
          'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
          'guerrillamail.info', 'spam4.me', 'tempr.email',
          'discard.email', 'discardmail.com', 'discardmail.de',
          'spamspot.com', 'spamthisplease.com', 'tempmail.com',
          'tempmail.net', 'tempmail.org', 'temp-mail.org',
          'getnada.com', 'mailnull.com', 'spamcannon.com',
          'spamcannon.net', 'spamcon.org', 'spameverywhere.net',
          'spamfree24.org', 'spamgob.com', 'spamherelots.com',
          'spamhereplease.com', 'spamhole.com', 'spamify.com',
          'spaminator.de', 'spamkill.info', 'spaml.com',
          'spaml.de', 'spammotel.com', 'spamobox.com',
          'spamslicer.com', 'spamstack.net', 'spamthis.co.uk',
          'spamtrap.ro', 'spamwc.de', 'spamz.de',
          'tempinbox.com', 'tempinbox.co.uk', 'tempemail.net',
          'mailnesia.com', 'maildrop.cc', 'fakeinbox.com',
          'mailnull.com', 'spamgenie.com', 'spamgob.com',
          'getairmail.com', 'filzmail.com', 'mt2015.com',
          'mt2014.com', 'veryrealemail.com', 'chogmail.com',
          'dispostable.com', '0-mail.com', '0815.ru',
          '0clickemail.com', '0wnd.net', '0wnd.org',
          '10minutemail.com', '10minutemail.net', '10minutemail.org',
          '10minutesmail.com', '20minutemail.com', '2prong.com',
          '30minutemail.com', '33mail.com', '3d-painting.com',
          'spamevader.com', 'inboxbear.com', 'mailsac.com'
        ];
        const domain = val.split('@')[1]?.toLowerCase();
        return !blockedDomains.includes(domain);
      }, 'Disposable or placeholder email addresses are not allowed. Please use your real email.')
      .refine((val) => {
        // Only allow real professional/personal email domains
        // Block obviously fake TLD patterns
        const domain = val.split('@')[1]?.toLowerCase() || '';
        const localPart = val.split('@')[0]?.toLowerCase() || '';

        // Block if local part is obviously fake
        const fakePrefixes = ['test', 'fake', 'dummy', 'sample', 'demo', 'placeholder', 'noreply', 'no-reply', 'donotreply', 'do-not-reply'];
        if (fakePrefixes.some(p => localPart === p || localPart.startsWith(p + '.'))) return false;

        // Block if domain has no TLD or is clearly fake
        if (!domain.includes('.')) return false;
        const tld = domain.split('.').pop() || '';
        if (tld.length < 2) return false;

        return true;
      }, 'Please provide a valid, active email address.'),
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
