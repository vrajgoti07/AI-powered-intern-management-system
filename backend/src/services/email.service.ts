import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { emailConfig } from '../config/email';
import { config } from '../config/env';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { renderTemplate } from '../email_templates';

class EmailService {
  private transporter: nodemailer.Transporter;
  private resendClient: Resend | null = null;

  constructor() {
    // Initialize Resend (HTTP-based, works on Render Free Tier)
    if (config.email.resendApiKey) {
      this.resendClient = new Resend(config.email.resendApiKey);
    }

    this.transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.port === 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      auth: emailConfig.user ? {
        user: emailConfig.user,
        pass: emailConfig.pass,
      } : undefined,
    });
  }

  /**
   * Verify email connection
   */
  public async verifyConnection() {
    if (this.resendClient) {
      logger.info('✅ Resend email provider configured (HTTP API — bypasses SMTP port blocks)');
      return true;
    }

    try {
      await this.transporter.verify();
      logger.info('✅ SMTP Mail Transporter verified successfully and is ready to send emails.');
      return true;
    } catch (error) {
      logger.error('❌ SMTP Mail Transporter verification failed on boot:', error);
      return false;
    }
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
      // Try Resend first (HTTP API — works on Render Free Tier)
      if (this.resendClient) {
        await this.resendClient.emails.send({
          from: emailConfig.from || 'InternFlow <onboarding@resend.dev>',
          to,
          subject,
          html,
        });
      } else {
        // Fallback to SMTP
        await this.transporter.sendMail({
          from: emailConfig.from,
          to,
          subject,
          html,
          attachments,
        });
      }

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
