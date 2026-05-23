import { notificationQueue } from '../queues/notification.queue';
import { logger } from '../utils/logger';

class JobScheduler {
  /**
   * Schedule a recurring daily report job
   */
  async scheduleDailyReport() {
    try {
      await notificationQueue.add('generate_daily_report', {}, {
        repeat: {
          pattern: '0 0 * * *', // Every midnight
        }
      });
      logger.info('Scheduled daily report job');
    } catch (error) {
      logger.error('Failed to schedule daily report:', error);
    }
  }

  /**
   * Schedule weekly reminders
   */
  async scheduleWeeklyReminders() {
    try {
      await notificationQueue.add('send_weekly_reminders', {}, {
        repeat: {
          pattern: '0 9 * * 1', // Every Monday at 9 AM
        }
      });
      logger.info('Scheduled weekly reminders job');
    } catch (error) {
      logger.error('Failed to schedule weekly reminders:', error);
    }
  }
}

export const jobScheduler = new JobScheduler();
export default jobScheduler;
