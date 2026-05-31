import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { config } from '../config/env';
import { logger } from './logger';
import fs from 'fs';
import path from 'path';

/**
 * Brevo API Key (HTTP-based, works on Render, sends to ANY email)
 */
const BREVO_API_KEY = config.email.brevoApiKey || null;

if (BREVO_API_KEY) {
  logger.info('✅ Brevo email provider configured (HTTP API — sends to any email, bypasses SMTP port blocks)');
}

/**
 * Initialize Resend client (HTTP-based, works on Render Free Tier but limited to owner email)
 */
const resendClient = config.email.resendApiKey
  ? new Resend(config.email.resendApiKey)
  : null;

if (resendClient && !BREVO_API_KEY) {
  logger.info('✅ Resend email provider configured (HTTP API — note: free tier only sends to account owner email)');
}

/**
 * Create SMTP email transporter (for local dev)
 */
const createTransporter = () => {
  if (!config.email.host || !config.email.user || !config.email.password) {
    logger.warn('Email SMTP configuration is incomplete. SMTP email will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

const transporter = createTransporter();

/**
 * Send email via Brevo HTTP API (sends to ANY email address, works on Render)
 */
const sendViaBrevo = async (to: string | string[], subject: string, html: string): Promise<boolean> => {
  if (!BREVO_API_KEY) return false;

  try {
    const toArray = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
    const senderEmail = config.email.user || 'hr.internflow@gmail.com';
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: 'InternFlow', email: senderEmail },
        to: toArray,
        subject,
        htmlContent: html,
      }),
    });

    if (response.ok) {
      const data: any = await response.json();
      const recipient = Array.isArray(to) ? `${to.length} recipients` : to;
      logger.info(`Email sent via Brevo to ${recipient} (messageId: ${data.messageId})`);
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      logger.error(`Brevo API error (${response.status}): ${JSON.stringify(errorData)}`);
      return false;
    }
  } catch (error: any) {
    logger.error('Brevo email delivery exception:', error?.message || error);
    return false;
  }
};

/**
 * Send email — Priority: Brevo (HTTP) → SMTP (local) → Resend (fallback)
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  // 1. Try Brevo first (HTTP API — works on Render, sends to ANY email)
  if (BREVO_API_KEY) {
    const sent = await sendViaBrevo(to, subject, html);
    if (sent) return true;
    // Fall through to other providers
  }

  // 2. Try SMTP (Gmail — works locally, blocked on Render free tier)
  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.email.from || config.email.user,
        to,
        subject,
        html,
      });
      logger.info(`Email sent via SMTP to ${to}`);
      return true;
    } catch (error: any) {
      logger.error(`SMTP email delivery failed to ${to}:`, error?.message || error);
      // Fall through to Resend
    }
  }

  // 3. Last resort: Resend (HTTP API — free tier only sends to owner email)
  if (resendClient) {
    try {
      const result = await resendClient.emails.send({
        from: 'InternFlow <onboarding@resend.dev>',
        replyTo: config.email.from || config.email.user || undefined,
        to,
        subject,
        html,
      });

      if (result.error) {
        logger.error(`Resend API error (${result.error.name}): ${result.error.message}`);
      } else {
        logger.info(`Email sent via Resend to ${to} (id: ${result.data?.id})`);
        return true;
      }
    } catch (error: any) {
      logger.error('Resend email delivery exception:', error?.message || error);
    }
  }

  logger.warn(`All email providers failed. Email to ${to} was NOT sent. Subject: ${subject}`);
  return false;
};



/**
 * Premium reusable HTML Email layout wrapper
 */
const getEmailWrapper = (title: string, bodyContent: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
        line-height: 1.6; 
        color: #334155; 
        background-color: #f8fafc; 
        margin: 0; 
        padding: 0; 
        -webkit-font-smoothing: antialiased;
      }
      .email-bg {
        background-color: #f8fafc;
        padding: 40px 20px;
      }
      .container { 
        max-width: 580px; 
        margin: 0 auto; 
        border-radius: 16px; 
        overflow: hidden; 
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.03); 
        background-color: #ffffff; 
        border: 1px solid #e2e8f0; 
      }
      .brand-accent {
        height: 6px;
        background: #4f46e5;
      }
      .header { 
        padding: 35px 40px 25px 40px; 
        text-align: left; 
        border-bottom: 1px solid #f1f5f9;
      }
      .logo-text {
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.03em;
        display: inline-flex;
        align-items: center;
      }
      .logo-dot {
        color: #4f46e5;
        font-size: 24px;
        line-height: 0;
        margin-left: 2px;
      }
      .content { 
        padding: 40px 40px; 
      }
      .email-title {
        font-size: 22px;
        font-weight: 800;
        color: #0f172a;
        margin-top: 0;
        margin-bottom: 24px;
        letter-spacing: -0.02em;
      }
      .button { 
        display: inline-block; 
        padding: 14px 32px; 
        background: #4f46e5; 
        color: #ffffff !important; 
        text-decoration: none !important; 
        border-radius: 12px; 
        font-weight: 700; 
        text-align: center; 
        font-size: 14px;
        letter-spacing: -0.01em;
        margin: 24px 0;
      }
      .footer { 
        text-align: center; 
        padding: 30px 40px; 
        background-color: #f8fafc; 
        color: #94a3b8; 
        font-size: 12px; 
        border-top: 1px solid #f1f5f9; 
      }
      .footer-divider {
        height: 1px;
        background-color: #e2e8f0;
        margin: 20px 0;
      }
      p { 
        margin: 0 0 16px 0; 
        color: #475569; 
        font-size: 15px; 
        line-height: 1.6;
      }
      strong { 
        color: #0f172a; 
      }
    </style>
  </head>
  <body>
    <div class="email-bg">
      <div class="container">
        <div class="brand-accent"></div>
        <div class="header">
          <div style="float: right; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 6px;">${title}</div>
          <div class="logo-text">InternFlow<span class="logo-dot">•</span></div>
          <div style="clear: both;"></div>
        </div>
        <div class="content">
          ${bodyContent}
        </div>
        <div class="footer">
          <p style="margin: 0; font-size: 12px; color: #94a3b8; font-weight: 500;">
            This is an automated operational transmission from the InternFlow security gate.
          </p>
          <div class="footer-divider"></div>
          <p style="margin: 0; font-size: 11px; color: #cbd5e1; font-weight: 600; uppercase; letter-spacing: 0.05em;">
            © 2026 InternFlow Inc. · One Hacker Way · Palo Alto, CA
          </p>
        </div>
      </div>
    </div>
  </body>
  </html>
`;

/**
 * Robust email template loader and compiler
 */
const compileTemplate = (filename: string, replacements: Record<string, string>): string => {
  try {
    const filePath = path.join(process.cwd(), 'email_templates', filename);
    if (fs.existsSync(filePath)) {
      let html = fs.readFileSync(filePath, 'utf8');
      Object.entries(replacements).forEach(([key, val]) => {
        // Safe regex escape
        const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedKey, 'g');
        html = html.replace(regex, val);
      });
      return html;
    } else {
      logger.warn(`Email template not found at: ${filePath}. Falling back to default layout.`);
    }
  } catch (error) {
    logger.error(`Failed to compile email template ${filename}:`, error);
  }
  
  // Safe fallback to getEmailWrapper if template file is missing
  return getEmailWrapper(filename.replace('.html', '').toUpperCase(), replacements['{{MAIN_MESSAGE}}'] || '');
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;

  const html = compileTemplate('password_reset.html', {
    'Hi Vraj,': `Hi ${name},`,
    'We received an authorized request to establish a new password credential for your secure InternFlow workspace. If you did not make this request, you can safely ignore this email. Your current password will remain active.': `We received an authorized request to establish a new password credential for your secure InternFlow workspace. Click the button below to complete password verification.`,
    'Chrome on Windows (103.42.5.12)': 'Active Session Verification',
    'https://internflow.com/reset-password?token=a8f90c7d2b': resetUrl
  });

  return await sendEmail(email, 'Password Reset Request', html);
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (
  email: string,
  name: string,
  role: string,
  resetToken?: string
): Promise<boolean> => {
  const setupUrl = resetToken 
    ? `${config.frontend.url}/reset-password?token=${resetToken}`
    : `${config.frontend.url}/login`;

  const html = compileTemplate('welcome.html', {
    'Hi Vraj,': `Hi ${name},`,
    'Engineering Intern': role.toUpperCase(),
    'vrajgoti@internflow.com': email,
    'https://internflow.com/login': setupUrl
  });

  return await sendEmail(email, 'Welcome to Intern Management System', html);
};

/**
 * Send application confirmation email
 */
export const sendApplicationConfirmationEmail = async (
  email: string,
  name: string,
  departmentName: string
): Promise<boolean> => {
  const html = compileTemplate('notification.html', {
    'Hi Vraj,': `Hi ${name},`,
    'You have received a new operational notification regarding your InternFlow workspace status. An administrator has updated the shared cohort resources folder with the Q2 engineering onboarding guidelines.': `Thank you for submitting your registration request for the internship program inside our ${departmentName} engineering cohort! Our talent acquisition team has successfully received your academic details and onboarding forms.`,
    'Platform / Operational Announcement': 'Registration Success',
    'HR Operations Team': 'Talent Acquisition Team',
    'Documentation Update': `${departmentName} Cohort`,
    'https://internflow.com/notifications': `${config.frontend.url}/login`,
    'View Workspace Notification': 'Access Workspace'
  });

  return await sendEmail(email, 'Application Received - Intern Management System', html);
};

/**
 * Send mentor assignment email to both mentor and intern
 */
export const sendMentorAssignmentEmails = async (
  internEmail: string,
  internName: string,
  mentorEmail: string,
  mentorName: string
): Promise<boolean> => {
  // 1. Send to Intern
  const internHtml = compileTemplate('mentor_assignment.html', {
    'Hi Vraj,': `Hi ${internName},`,
    'Sarah Jenkins (Senior Staff Engineer)': mentorName,
    'Software Development (Backend)': 'Program Coordinator & Mentor',
    'sarah.jenkins@internflow.com': mentorEmail,
    'mailto:sarah.jenkins@internflow.com': `mailto:${mentorEmail}`,
    'https://internflow.com/mentor': `${config.frontend.url}/login`
  });
  const sentToIntern = await sendEmail(internEmail, 'Mentor Assigned - Intern Management System', internHtml);

  // 2. Send to Mentor
  const mentorHtml = compileTemplate('mentor_assignment.html', {
    'Hi Vraj,': `Hi ${mentorName},`,
    'Mentor Assignment': 'Intern Assigned',
    'We are pleased to inform you that your industry mentor has been assigned for the duration of your internship program. Your mentor will guide you through project scopes, review milestone submissions, and support your professional growth.': `A new member has been provisioned under your cohort track and assigned to you for direct directives supervision.`,
    'Sarah Jenkins (Senior Staff Engineer)': internName,
    'Software Development (Backend)': 'Cohort Intern Member',
    'sarah.jenkins@internflow.com': internEmail,
    'mailto:sarah.jenkins@internflow.com': `mailto:${internEmail}`,
    'https://internflow.com/mentor': `${config.frontend.url}/login`
  });
  const sentToMentor = await sendEmail(mentorEmail, 'New Intern Assigned under your Guidance', mentorHtml);

  return sentToIntern && sentToMentor;
};

/**
 * Send performance score update email
 */
export const sendPerformanceScoreEmail = async (
  email: string,
  name: string,
  score: number
): Promise<boolean> => {
  const html = compileTemplate('notification.html', {
    'Hi Vraj,': `Hi ${name},`,
    'You have received a new operational notification regarding your InternFlow workspace status. An administrator has updated the shared cohort resources folder with the Q2 engineering onboarding guidelines.': `Your program coordinator has submitted a new rating evaluation inside your performance analytics logbook. Your aggregated performance score is currently evaluated at ${score}%.`,
    'Platform / Operational Announcement': 'Evaluation Grade',
    'HR Operations Team': 'Program Coordinator',
    'Documentation Update': `Score Rating: ${score}%`,
    'https://internflow.com/notifications': `${config.frontend.url}/login`,
    'View Workspace Notification': 'View Performance Portal'
  });

  return await sendEmail(email, 'Performance Evaluation Score Updated', html);
};

/**
 * Send Announcement Broadcast Email
 */
export const sendAnnouncementEmail = async (
  emails: string[],
  title: string,
  content: string,
  author: string,
  priority: string
): Promise<boolean> => {
  if (emails.length === 0) return true;

  const html = compileTemplate('notification.html', {
    'Hi Vraj,': `Hi Intern,`,
    'You have received a new operational notification regarding your InternFlow workspace status. An administrator has updated the shared cohort resources folder with the Q2 engineering onboarding guidelines.': `An administrator has broadcasted a new cohort announcement: "${title}". Description: ${content}`,
    'Platform / Operational Announcement': `${priority} PRIORITY`,
    'HR Operations Team': author,
    'Documentation Update': 'Cohort Broadcast',
    'https://internflow.com/notifications': `${config.frontend.url}/login`,
    'View Workspace Notification': 'Launch Dashboard Portal'
  });

  const subject = `[${priority} Priority] ${title}`;

  // 1. Try Brevo first (HTTP API — sends to ANY email, works on Render)
  if (BREVO_API_KEY) {
    const sent = await sendViaBrevo(emails, subject, html);
    if (sent) return true;
  }

  // 2. Try SMTP (Gmail — works locally)
  if (transporter) {
    try {
      await transporter.sendMail({
        from: config.email.from || config.email.user,
        bcc: emails,
        subject,
        html,
      });
      logger.info(`Announcement email sent via SMTP to ${emails.length} recipients`);
      return true;
    } catch (error: any) {
      logger.error('SMTP announcement delivery failed:', error?.message || error);
    }
  }

  // 3. Last resort: Resend
  if (resendClient) {
    try {
      const result = await resendClient.emails.send({
        from: 'InternFlow <onboarding@resend.dev>',
        replyTo: config.email.from || config.email.user || undefined,
        to: emails,
        subject,
        html,
      });

      if (result.error) {
        logger.error(`Resend announcement error (${result.error.name}): ${result.error.message}`);
      } else {
        logger.info(`Announcement email sent via Resend to ${emails.length} recipients (id: ${result.data?.id})`);
        return true;
      }
    } catch (error: any) {
      logger.error('Resend announcement delivery failed:', error?.message || error);
    }
  }

  logger.warn('All email providers failed. Skipping announcement email.');
  return false;
};

/**
 * Send Login Verification OTP Email
 */
export const sendLoginOtpEmail = async (
  email: string,
  name: string,
  otpCode: string,
  ipAddress: string,
  timestamp: string
): Promise<boolean> => {
  const html = compileTemplate('notification.html', {
    'Hi Vraj,': `Hi ${name},`,
    'You have received a new operational notification regarding your InternFlow workspace status. An administrator has updated the shared cohort resources folder with the Q2 engineering onboarding guidelines.': `A login request was initiated for your InternFlow workspace. Please use the following 6-digit secure authentication passcode to complete access verification: ${otpCode}`,
    'Platform / Operational Announcement': 'Identity Verification',
    'HR Operations Team': 'Authentication Service',
    'Documentation Update': `IP: ${ipAddress} · Time: ${timestamp}`,
    'https://internflow.com/notifications': `${config.frontend.url}/login`,
    'View Workspace Notification': `Code: ${otpCode}`
  });

  if (!transporter && !resendClient && !BREVO_API_KEY) {
    logger.info(`[MOCK EMAIL DELIVERY] OTP for ${email} (${name}) is: ${otpCode}`);
    return true;
  }

  const success = await sendEmail(email, 'Secure Access Verification Code - InternFlow', html);
  if (!success) {
    logger.warn('SMTP Delivery failed, logging fallback OTP for development/debug access.');
    logger.info(`[FALLBACK EMAIL DELIVERY] OTP for ${email} (${name}) is: ${otpCode}`);
  }
  return true;
};
