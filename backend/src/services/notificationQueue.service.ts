import { safeAddJob } from '../queues/notification.queue';

class NotificationQueueService {
  /**
   * Queue a real-time/in-app notification directly
   */
  async queueDirectNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    data?: any;
    triggerEmail?: boolean;
    emailSubject?: string;
  }) {
    return await safeAddJob('send_direct_notification', data);
  }

  /**
   * Queue a bulk in-app notification
   */
  async queueBulkNotification(data: {
    userIds: string[];
    title: string;
    message: string;
    type: string;
    data?: any;
  }) {
    return await safeAddJob('send_bulk_notification', data);
  }

  /**
   * Queue a standard email
   */
  async queueEmail(to: string, subject: string, html: string) {
    return await safeAddJob('send_email', { to, subject, html });
  }

  /**
   * Queue welcome email
   */
  async queueWelcomeEmail(email: string, name: string, role: string, resetToken: string) {
    return await safeAddJob('send_welcome_email', { email, name, role, resetToken });
  }

  /**
   * Queue application confirmation email
   */
  async queueApplicationConfirmation(email: string, name: string, departmentName: string) {
    return await safeAddJob('send_application_confirmation', { email, name, departmentName });
  }

  /**
   * Queue mentor assignment emails
   */
  async queueMentorAssignment(internEmail: string, internName: string, mentorEmail: string, mentorName: string) {
    return await safeAddJob('send_mentor_assignment', { internEmail, internName, mentorEmail, mentorName });
  }

  /**
   * Queue score update email
   */
  async queueScoreUpdate(email: string, name: string, score: number) {
    return await safeAddJob('send_score_update', { email, name, score });
  }
}

export const notificationQueueService = new NotificationQueueService();
export default notificationQueueService;
