import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import { emailService } from '../../services/email.service';
import { logger } from '../../utils/logger';

export const emailWorker = new Worker(
  'emailQueue',
  async (job: Job) => {
    logger.info(`Processing email job ${job.id} of type ${job.name}`);
    
    if (job.name === 'PLACEMENT_CONFIRMED_EMAIL') {
      const { placementId, internEmail, mentorEmail, internName, mentorName, department, matchScore, appliedAt } = job.data;
      
      const prisma = (await import('../../config/database')).default;
      const placement = await prisma.placement.findUnique({
        where: { id: placementId }
      });
      
      if (!placement || placement.status === 'Revoked') {
        logger.info(`Placement ${placementId} was revoked or deleted. Skipping delayed emails.`);
        return;
      }
      
      // Update placement status to Confirmed
      await prisma.placement.update({
        where: { id: placementId },
        data: { status: 'Confirmed', emailSent: true }
      });
      
      const { sendMentorEmail, sendInternEmail } = await import('../../lib/emails/placementEmails');
      
      await sendMentorEmail(mentorEmail, mentorName, internName, department, matchScore, appliedAt);
      await sendInternEmail(internEmail, internName, mentorName, department, matchScore);
      return;
    }

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
