import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { emailConfig } from '../config/email';
import { config } from '../config/env';
import prisma from '../config/database';
import { logger } from '../utils/logger';
import { renderTemplate } from '../email_templates';

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private resendClient: Resend | null = null;
  private brevoApiKey: string | null = null;

  constructor() {
    // Initialize Brevo (HTTP-based, sends to ANY email, works on Render)
    if (config.email.brevoApiKey) {
      this.brevoApiKey = config.email.brevoApiKey;
    }

    // Initialize Resend (HTTP-based, free tier limited to owner email)
    if (config.email.resendApiKey) {
      this.resendClient = new Resend(config.email.resendApiKey);
    }

    // Only create SMTP transporter if no HTTP provider is configured
    if (!this.brevoApiKey && !this.resendClient && emailConfig.host && emailConfig.user) {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.port === 465,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
        auth: {
          user: emailConfig.user,
          pass: emailConfig.pass,
        },
      });
    }
  }

  /**
   * Send email via Brevo HTTP API
   */
  private async sendViaBrevo(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.brevoApiKey) return false;

    const senderEmail = emailConfig.user || 'hr.internflow@gmail.com';

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': this.brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'InternFlow', email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });

    if (response.ok) {
      const data: any = await response.json();
      logger.info(`Email sent via Brevo to ${to} (messageId: ${data.messageId})`);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Brevo API error (${response.status}): ${JSON.stringify(errorData)}`);
    }
  }

  /**
   * Verify email connection
   */
  public async verifyConnection() {
    if (this.brevoApiKey) {
      logger.info('✅ Brevo email provider configured (HTTP API — sends to any email, bypasses SMTP port blocks)');
      return true;
    }

    if (this.resendClient) {
      logger.info('✅ Resend email provider configured (HTTP API — note: free tier only sends to account owner email)');
      return true;
    }

    if (!this.transporter) {
      logger.warn('⚠️  No email provider configured (set BREVO_API_KEY for production, or SMTP_HOST/SMTP_USER for local). Emails will NOT be sent.');
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('✅ SMTP Mail Transporter verified successfully and is ready to send emails.');
      return true;
    } catch (error) {
      logger.warn('⚠️  SMTP connection failed (expected on Render free tier). Set BREVO_API_KEY for production email delivery.');
      return false;
    }
  }

  /**
   * Internal method to send an email and log it
   * Priority: Brevo → SMTP → Resend
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
      // 1. Try Brevo first (HTTP API — sends to ANY email)
      if (this.brevoApiKey) {
        const sent = await this.sendViaBrevo(to, subject, html);
        if (sent) {
          await prisma.emailLog.update({
            where: { id: log.id },
            data: { status: 'SENT', attempts: { increment: 1 } }
          });
          logger.info(`Email sent successfully to ${to} via Brevo (Subject: ${subject})`);
          return true;
        }
      }

      // 2. Try SMTP
      if (this.transporter) {
        await this.transporter.sendMail({
          from: emailConfig.from,
          to,
          subject,
          html,
          attachments,
        });
      }
      // 3. Try Resend
      else if (this.resendClient) {
        await this.resendClient.emails.send({
          from: emailConfig.from || 'InternFlow <onboarding@resend.dev>',
          to,
          subject,
          html,
        });
      } else {
        throw new Error('No email provider configured. Set BREVO_API_KEY, RESEND_API_KEY, or SMTP credentials.');
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

