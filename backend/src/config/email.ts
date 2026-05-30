import { z } from 'zod';

const emailConfigSchema = z.object({
  host: z.string().default('smtp.gmail.com'),
  port: z.coerce.number().default(587),
  user: z.string().optional(),
  pass: z.string().optional(),
  from: z.string().default('noreply@company.com'),
});

const envVars = {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASSWORD,
  from: process.env.EMAIL_FROM,
};

const parsed = emailConfigSchema.safeParse(envVars);

if (!parsed.success) {
  console.error('Invalid email configuration:', parsed.error.format());
  process.exit(1);
}

export const emailConfig = parsed.data;
