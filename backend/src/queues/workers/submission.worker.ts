import { Worker, Job } from 'bullmq';
import redis from '../../config/redis';
import submissionAnalysisService from '../../services/submissionAnalysis.service';
import { logger } from '../../utils/logger';

export const submissionWorker = new Worker(
  'submissionQueue',
  async (job: Job) => {
    logger.info(`Processing submission analysis job ${job.id} (Name: ${job.name})`);
    
    if (job.name === 'ANALYZE_SUBMISSION') {
      const { taskFileId, taskId, organizationId } = job.data;
      if (!taskFileId || !taskId || !organizationId) {
        throw new Error('Missing job payload fields: taskFileId, taskId, or organizationId');
      }

      await submissionAnalysisService.analyzeSubmissionSync(taskFileId, taskId, organizationId);
    } else {
      logger.warn(`Unknown job name in submission worker: ${job.name}`);
    }
  },
  {
    connection: redis as any,
    concurrency: 2, // Allow 2 files to be analyzed concurrently
  }
);

submissionWorker.on('completed', (job) => {
  logger.info(`Submission analysis job ${job.id} completed successfully`);
});

submissionWorker.on('failed', (job, err) => {
  logger.error(`Submission analysis job ${job?.id} failed with error: ${err.message}`);
});
