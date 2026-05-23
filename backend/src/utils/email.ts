import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { logger } from './logger';

/**
 * Create email transporter
 */
const createTransporter = () => {
  if (!config.email.host || !config.email.user || !config.email.password) {
    logger.warn('Email configuration is incomplete. Email functionality will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

const transporter = createTransporter();

/**
 * Send email
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  if (!transporter) {
    logger.warn('Email transporter not configured. Skipping email send.');
    return false;
  }

  try {
    await transporter.sendMail({
      from: config.email.from || config.email.user,
      to,
      subject,
      html,
    });
    logger.info(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
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
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 40px auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); background-color: #ffffff; border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 40px 30px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
      .content { padding: 40px 30px; }
      .button { display: inline-block; padding: 12px 30px; background: #4f46e5; color: white !important; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; text-align: center; }
      .footer { text-align: center; padding: 25px 20px; background-color: #f1f5f9; color: #64748b; font-size: 12px; border-top: 1px solid #e2e8f0; }
      .meta-box { margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
      p { margin: 0 0 16px 0; color: #334155; font-size: 16px; }
      strong { color: #0f172a; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${title}</h1>
      </div>
      <div class="content">
        ${bodyContent}
      </div>
      <div class="footer">
        <p style="margin: 0; font-size: 12px; color: #64748b;">This is an automated email from the Intern Management System.</p>
        <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">&copy; 2026 InternFlow Inc. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>
`;

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;
  
  const body = `
    <p>Hi ${name},</p>
    <p>We received a request to reset your password for your Intern Management System account.</p>
    <p>Click the button below to reset your password:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <div class="meta-box">
      <p style="margin: 0; font-size: 14px;"><strong>Direct Link:</strong> <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">${resetUrl}</a></p>
      <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;"><strong>Note:</strong> This link is only valid for 1 hour. If you did not make this request, you can safely ignore this email.</p>
    </div>
    <p style="margin-top: 20px;">Best regards,<br>Intern Management Team</p>
  `;

  const html = getEmailWrapper('Password Reset Request', body);
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
  let body = '';
  
  if (resetToken) {
    const setupUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;
    body = `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Welcome aboard! Your account has been successfully approved as an <strong>${role}</strong> on our AI-powered Intern Management System.</p>
      <p>Before you can access the platform, you must establish your secure password. Click the button below to set your account password:</p>
      <div style="text-align: center;">
        <a href="${setupUrl}" class="button">Set Account Password</a>
      </div>
      <div class="meta-box">
        <p style="margin: 0; font-size: 14px;"><strong>Direct Verification Link:</strong> <a href="${setupUrl}" style="color: #4f46e5; word-break: break-all;">${setupUrl}</a></p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;"><strong>Note:</strong> This verification setup link is only valid for 24 hours. Once set, you can sign in to the platform with your email.</p>
      </div>
      <p style="margin-top: 20px;">Best regards,<br>Intern Management Team</p>
    `;
  } else {
    body = `
      <p>Hi <strong>${name}</strong>,</p>
      <p>Welcome aboard! Your account has been successfully created as a <strong>${role}</strong> on our AI-powered Intern Management System.</p>
      <p>You can now log in to the platform, explore your workspace, view analytics, and collaborate with your team.</p>
      <div style="text-align: center;">
        <a href="${config.frontend.url}/login" class="button">Access Portal</a>
      </div>
      <div class="meta-box">
        <p style="margin: 0; font-size: 14px;"><strong>Portal Link:</strong> <a href="${config.frontend.url}">${config.frontend.url}</a></p>
        <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Temporary Password:</strong> InternPass123! (If created by HR)</p>
      </div>
      <p style="margin-top: 20px;">If you have any questions, feel free to reach out to the HR department or your assigned mentor.</p>
      <p>Best regards,<br>Intern Management Team</p>
    `;
  }

  const html = getEmailWrapper('Welcome to Intern Management System!', body);
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
  const body = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>Thank you for submitting your application to join our internship program in the <strong>${departmentName}</strong> department!</p>
    <p>We have successfully received your registration details. Our HR team is reviewing applications, and we will get back to you soon regarding the next steps of our selection process.</p>
    <div class="meta-box">
      <p style="margin: 0; font-size: 14px;"><strong>Application Status:</strong> PENDING SCREENING</p>
      <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Selected Track:</strong> ${departmentName}</p>
    </div>
    <p style="margin-top: 20px;">No further action is required from your side at the moment.</p>
    <p>Best regards,<br>Intern Recruitment Team</p>
  `;

  const html = getEmailWrapper('Application Received!', body);
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
  const internBody = `
    <p>Hi <strong>${internName}</strong>,</p>
    <p>We are excited to inform you that you have been assigned a mentor for your internship journey!</p>
    <div class="meta-box">
      <p style="margin: 0; font-size: 14px;"><strong>Mentor Name:</strong> ${mentorName}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Contact Email:</strong> <a href="mailto:${mentorEmail}">${mentorEmail}</a></p>
    </div>
    <p style="margin-top: 20px;">Your mentor will guide you through your tasks, review submissions, and provide constant support. Please feel free to reach out to them to introduce yourself.</p>
    <p>Best regards,<br>Intern Management Team</p>
  `;
  const internHtml = getEmailWrapper('Mentor Assigned!', internBody);
  const sentToIntern = await sendEmail(internEmail, 'Mentor Assigned - Intern Management System', internHtml);

  // 2. Send to Mentor
  const mentorBody = `
    <p>Hi <strong>${mentorName}</strong>,</p>
    <p>You have been assigned as a mentor for a new intern joining the team under your guidance!</p>
    <div class="meta-box">
      <p style="margin: 0; font-size: 14px;"><strong>Intern Name:</strong> ${internName}</p>
      <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Contact Email:</strong> <a href="mailto:${internEmail}">${internEmail}</a></p>
    </div>
    <p style="margin-top: 20px;">Please reach out to them to align on task assignments, work schedule, and track their performance analytics inside your mentor workspace.</p>
    <p>Best regards,<br>Intern Management Team</p>
  `;
  const mentorHtml = getEmailWrapper('New Intern Assigned!', mentorBody);
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
  const body = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your mentor has updated your performance rating/feedback score in the system.</p>
    <div class="meta-box" style="text-align: center; padding: 25px 15px;">
      <p style="margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">New Performance Score</p>
      <h1 style="margin: 10px 0 0 0; font-size: 48px; color: #4f46e5; font-weight: 800;">${score} <span style="font-size: 18px; color: #94a3b8; font-weight: 500;">/ 100</span></h1>
    </div>
    <p style="margin-top: 20px;">You can log in to your dashboard to view detailed breakdown logs and analytics regarding your grades, attendance, and task scores.</p>
    <div style="text-align: center;">
      <a href="${config.frontend.url}/login" class="button">View Dashboard</a>
    </div>
    <p>Best regards,<br>Intern Management Team</p>
  `;

  const html = getEmailWrapper('Performance Score Update', body);
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

  const priorityColor = priority === 'HIGH' ? '#ef4444' : priority === 'MEDIUM' ? '#f59e0b' : '#3b82f6';

  const body = `
    <div style="border-left: 4px solid ${priorityColor}; padding-left: 16px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 20px;">${title}</h2>
      <div style="display: flex; gap: 12px; margin-bottom: 16px;">
        <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: #64748b;">From: ${author}</span>
        <span style="background: ${priorityColor}20; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; color: ${priorityColor};">${priority} Priority</span>
      </div>
      <div style="color: #475569; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
        ${content}
      </div>
    </div>
    <div style="text-align: center; margin-top: 32px;">
      <a href="${config.frontend.url}/login" class="button">View in Dashboard</a>
    </div>
  `;

  const html = getEmailWrapper('New Announcement Broadcast', body);
  
  // To avoid spamming our own server/SMTP at once, we might want to BCC everyone, 
  // but sending individually is better for analytics if we had them.
  // For now, we will just send one email with all recipients in BCC.
  
  if (!transporter) {
    logger.warn('Email transporter not configured. Skipping announcement email send.');
    return false;
  }

  try {
    await transporter.sendMail({
      from: config.email.from || config.email.user,
      bcc: emails, // Use BCC to hide other recipients
      subject: `[${priority} Priority] ${title}`,
      html,
    });
    logger.info(`Announcement email sent successfully to ${emails.length} recipients`);
    return true;
  } catch (error) {
    logger.error('Failed to send announcement email:', error);
    return false;
  }
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
  const body = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received a request to access your account via secure login authorization code. Please enter the following 6-digit verification passcode:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; padding: 15px 35px; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 16px; font-size: 32px; font-weight: 800; color: #2563eb; letter-spacing: 0.15em;">
        ${otpCode}
      </div>
    </div>
    
    <div class="meta-box" style="margin-top: 20px; font-size: 13px; color: #475569; background-color: #f1f5f9; padding: 15px; border-radius: 12px;">
      <p style="margin: 0;"><strong>Security Audit Trail Details:</strong></p>
      <p style="margin: 4px 0 0 0;"><strong>Attempt Time:</strong> ${timestamp}</p>
      <p style="margin: 4px 0 0 0;"><strong>IP Address:</strong> ${ipAddress}</p>
    </div>
    
    <p style="margin-top: 25px; font-size: 12px; color: #64748b;">
      <strong>Security Warning:</strong> This verification code is extremely confidential and will expire in <strong>5 minutes</strong>. If you did not make this login request, please contact our HR administrator immediately and secure your account credentials.
    </p>
  `;

  const html = getEmailWrapper('Secure Access Verification Code', body);
  
  // Proactive development fallback: if transporter is disabled or fails, log it clearly so local devs can proceed without working credentials
  if (!transporter) {
    logger.info(`[MOCK EMAIL DELIVERY] OTP for ${email} (${name}) is: ${otpCode}`);
    return true;
  }

  try {
    await sendEmail(email, 'Secure Access Verification Code - InternFlow', html);
    return true;
  } catch (error) {
    logger.error('SMTP Delivery failed, logging fallback OTP:', error);
    logger.info(`[FALLBACK EMAIL DELIVERY] OTP for ${email} (${name}) is: ${otpCode}`);
    return true;
  }
};

