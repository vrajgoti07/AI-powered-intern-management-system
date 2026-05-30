import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import { emailService } from '../../services/email.service';
import { logger } from '../../utils/logger';

export const emailWorker = new Worker(
  'emailQueue',
  async (job: Job) => {
    logger.info(`Processing email job ${job.id} of type ${job.name}`);
    const { to, data } = job.data;
    
    // Call the email service which handles rendering and DB logging
    await emailService.sendTemplateEmail(job.name, data, to);
  },
  {
    connection: redis as any,
    concurrency: 5, // Process up to 5 emails concurrently
  }
);

emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} completed successfully`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} failed with error: ${err.message}`);
});
