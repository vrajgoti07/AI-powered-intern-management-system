import nodemailer from 'nodemailer';
import { emailConfig } from '../config/email';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { renderTemplate } from '../email_templates';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465,
      auth: emailConfig.user ? {
        user: emailConfig.user,
        pass: emailConfig.pass,
      } : undefined,
    });
  }

  /**
   * Internal method to send an email and log it
   */
  public async sendEmail(
    to: string,
    subject: string,
    html: string,
    templateName?: string,
    attachments?: any[]
  ) {
    const log = await prisma.emailLog.create({
      data: {
        to,
        subject,
        status: 'PENDING',
        templateName,
      }
    });

    try {
      await this.transporter.sendMail({
        from: emailConfig.from,
        to,
        subject,
        html,
        attachments,
      });

      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: 'SENT',
          attempts: { increment: 1 }
        }
      });

      logger.info(`Email sent successfully to ${to} (Subject: ${subject})`);
      return true;
    } catch (error: any) {
      await prisma.emailLog.update({
        where: { id: log.id },
        data: {
          status: 'FAILED',
          error: error.message || 'Unknown error',
          attempts: { increment: 1 }
        }
      });
      logger.error(`Failed to send email to ${to}:`, error);
      throw error; // Throw so BullMQ can retry
    }
  }

  // --- Specific Email Methods ---

  public async sendTemplateEmail(type: string, data: any, to: string) {
    const { subject, html } = renderTemplate(type, data);
    return this.sendEmail(to, subject, html, type);
  }
}

export const emailService = new EmailService();
