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

// Proactively verify the transporter on startup to alert developers of SMTP issues
if (transporter) {
  transporter.verify()
    .then(() => {
      logger.info('✅ SMTP Mail Transporter verified successfully and is ready to send emails.');
    })
    .catch((err) => {
      logger.error('❌ SMTP Mail Transporter verification failed on boot:', err);
    });
}

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
        background: linear-gradient(90deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);
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
        color: #2563eb;
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
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); 
        color: #ffffff !important; 
        text-decoration: none !important; 
        border-radius: 12px; 
        font-weight: 700; 
        text-align: center; 
        font-size: 14px;
        letter-spacing: -0.01em;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        margin: 24px 0;
        transition: all 0.2s ease;
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
      .meta-box { 
        margin-top: 24px; 
        padding: 20px; 
        background-color: #f8fafc; 
        border-radius: 12px; 
        border: 1px solid #e2e8f0; 
      }
      .badge {
        display: inline-block;
        padding: 6px 12px;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        border-radius: 6px;
        margin-bottom: 12px;
      }
      .badge-info {
        background-color: #eff6ff;
        color: #1e40af;
      }
      .badge-success {
        background-color: #ecfdf5;
        color: #065f46;
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
      .grid-card {
        padding: 16px;
        background-color: #ffffff;
        border: 1px solid #f1f5f9;
        border-radius: 10px;
        margin-bottom: 12px;
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
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> => {
  const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;

  const body = `
    <span class="badge badge-info">Security Notice</span>
    <h2 class="email-title">Password Reset Requested</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received an authorized request to establish a new credential password for your secure InternFlow workspace.</p>
    <p>Please use the verification gateway button below to set up your new credentials:</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Configure New Password</a>
    </div>
    <div class="meta-box">
      <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #0f172a;">Gateway Link Details:</p>
      <p style="margin: 0 0 8px 0; font-size: 13px; color: #2563eb; word-break: break-all;"><a href="${resetUrl}" style="color: #2563eb; text-decoration: none;">${resetUrl}</a></p>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500; border-t: 1px dashed #e2e8f0; padding-top: 10px;">
        <strong>Notice:</strong> This security token is highly confidential and will automatically expire in <strong>1 hour</strong>. If you did not issue this password reset directive, please report this access attempt to security@internflow.com.
      </p>
    </div>
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
      <span class="badge badge-success">Onboarding Invitation</span>
      <h2 class="email-title">Welcome to InternFlow!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Congratulations! Your corporate profile has been successfully provisioned as a registered <strong>${role.toUpperCase()}</strong> on the InternFlow management portal.</p>
      <p>To initialize your secure workspace access, you must establish a personal account password. Click the verification button below to set up your credential:</p>
      <div style="text-align: center;">
        <a href="${setupUrl}" class="button">Initialize Account Password</a>
      </div>
      <div class="meta-box">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #0f172a;">Activation Details:</p>
        <p style="margin: 0 0 8px 0; font-size: 13px; color: #2563eb; word-break: break-all;"><a href="${setupUrl}" style="color: #2563eb; text-decoration: none;">${setupUrl}</a></p>
        <p style="margin: 12px 0 0 0; font-size: 11px; color: #64748b; font-weight: 500; border-t: 1px dashed #e2e8f0; padding-top: 10px;">
          <strong>Security Note:</strong> This activation gateway is highly sensitive and will expire in <strong>24 hours</strong>. Please configure your password immediately to prevent configuration suspension.
        </p>
      </div>
    `;
  } else {
    body = `
      <span class="badge badge-success">Account Provisioned</span>
      <h2 class="email-title">Account Successfully Created!</h2>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your platform profile is active as a registered <strong>${role.toUpperCase()}</strong>. You are cleared to log in, customize your settings, and access the daily milestones tracker.</p>
      <div style="text-align: center;">
        <a href="${config.frontend.url}/login" class="button">Access Platform</a>
      </div>
      <div class="meta-box">
        <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: bold; color: #0f172a;">Workspace Details:</p>
        <div class="grid-card">
          <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;"><strong>Portal Address:</strong> <a href="${config.frontend.url}" style="color: #2563eb; text-decoration: none;">${config.frontend.url}</a></p>
          <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Default Password:</strong> <code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #0f172a; font-weight: bold;">InternPass123!</code></p>
        </div>
        <p style="margin: 10px 0 0 0; font-size: 11px; color: #ef4444; font-weight: bold;">
          ⚠️ Warning: You are strictly required to update your password immediately upon your first successful login.
        </p>
      </div>
    `;
  }

  const html = getEmailWrapper('Welcome to InternFlow', body);
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
    <span class="badge badge-info">Registration Success</span>
    <h2 class="email-title">Application Received!</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Thank you for submitting your registration request for the internship program inside our <strong>${departmentName}</strong> engineering cohort!</p>
    <p>Our talent acquisition team has received your academic details and onboarding forms. No further action is required from you at this stage.</p>
    
    <div class="meta-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
      <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">Onboarding Timeline status:</p>
      
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <div style="padding: 10px 14px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 6px;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; color: #1e3a8a;">[✓] Application Form Submitted</p>
        </div>
        <div style="padding: 10px 14px; background-color: #f8fafc; border-left: 4px solid #cbd5e1; border-radius: 6px; opacity: 0.8;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; color: #64748b;">[ ] Academic Documents Review (In Progress)</p>
        </div>
        <div style="padding: 10px 14px; background-color: #f8fafc; border-left: 4px solid #cbd5e1; border-radius: 6px; opacity: 0.8;">
          <p style="margin: 0; font-size: 12px; font-weight: 700; color: #64748b;">[ ] HR Approval & Account Provisioning</p>
        </div>
      </div>
      
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #64748b;">
        <strong>Track Assigned:</strong> ${departmentName} Cohort
      </p>
    </div>
  `;

  const html = getEmailWrapper('Application Received', body);
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
    <span class="badge badge-success">milestone assigned</span>
    <h2 class="email-title">Your Mentor is Assigned!</h2>
    <p>Hi <strong>${internName}</strong>,</p>
    <p>We are thrilled to announce that your corporate coordinator has been assigned to support you through your milestones track!</p>
    
    <div class="meta-box" style="padding: 24px; text-align: left; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
      <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Assigned Coordinator Profile:</p>
      
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="width: 48px; height: 48px; background-color: #4f46e5; color: white; border-radius: 50%; font-size: 20px; font-weight: bold; text-align: center; line-height: 48px;">
          ${mentorName.charAt(0)}
        </div>
        <div>
          <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">${mentorName}</h4>
          <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">Program Coordinator & Mentor</p>
        </div>
      </div>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Email Address:</strong> <a href="mailto:${mentorEmail}" style="color: #2563eb; text-decoration: none;">${mentorEmail}</a></p>
      </div>
    </div>
    
    <p style="margin-top: 24px;">Your mentor will oversee task scopes, grade deliverables, and check Daily Standup notes. Reach out immediately to introduce yourself!</p>
  `;
  const internHtml = getEmailWrapper('Mentor Assigned', internBody);
  const sentToIntern = await sendEmail(internEmail, 'Mentor Assigned - Intern Management System', internHtml);

  // 2. Send to Mentor
  const mentorBody = `
    <span class="badge badge-success">intern assigned</span>
    <h2 class="email-title">New Intern Mentorship!</h2>
    <p>Hi <strong>${mentorName}</strong>,</p>
    <p>A new member has been provisioned under your cohort track and assigned to you for direct directives supervision.</p>
    
    <div class="meta-box" style="padding: 24px; text-align: left; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
      <p style="margin: 0 0 16px 0; font-size: 12px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Intern Profile Details:</p>
      
      <div style="display: flex; align-items: center; gap: 16px;">
        <div style="width: 48px; height: 48px; background-color: #06b6d4; color: white; border-radius: 50%; font-size: 20px; font-weight: bold; text-align: center; line-height: 48px;">
          ${internName.charAt(0)}
        </div>
        <div>
          <h4 style="margin: 0; font-size: 16px; font-weight: 800; color: #0f172a;">${internName}</h4>
          <p style="margin: 2px 0 0 0; font-size: 13px; color: #64748b;">Cohort Intern Member</p>
        </div>
      </div>
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #475569;"><strong>Email Address:</strong> <a href="mailto:${internEmail}" style="color: #2563eb; text-decoration: none;">${internEmail}</a></p>
      </div>
    </div>
    
    <p style="margin-top: 24px;">Please connect with them to outline their initial milestones and task assignments inside your supervisor dashboard.</p>
  `;
  const mentorHtml = getEmailWrapper('New Intern Assigned', mentorBody);
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
    <span class="badge badge-info">Evaluation Grade</span>
    <h2 class="email-title">Milestone Rating Updated!</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your program coordinator has submitted a new rating evaluation inside your performance analytics logbook.</p>
    
    <div style="margin: 24px 0; padding: 30px; background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); border: 1px solid #dbeafe; border-radius: 16px; text-align: center;">
      <p style="margin: 0; font-size: 11px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.1em;">Aggregated Performance score</p>
      <h1 style="margin: 12px 0 0 0; font-size: 64px; color: #1d4ed8; font-weight: 900; letter-spacing: -0.04em;">
        ${score}<span style="font-size: 24px; color: #94a3b8; font-weight: 600; letter-spacing: 0;">%</span>
      </h1>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b; font-weight: 600;">Overall Program Rating</p>
    </div>
    
    <p>Access your dashboard page to view detailed performance metrics, grade timelines, and feedback comments from your supervisor.</p>
    <div style="text-align: center; margin-top: 20px;">
      <a href="${config.frontend.url}/login" class="button">View Performance Portal</a>
    </div>
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
  const priorityBg = priority === 'HIGH' ? '#fef2f2' : priority === 'MEDIUM' ? '#fffbeb' : '#eff6ff';

  const body = `
    <span class="badge" style="background-color: ${priorityBg}; color: ${priorityColor};">${priority} PRIORITY</span>
    <h2 class="email-title">Important Broadcast Announcement</h2>
    
    <div style="border-left: 4px solid ${priorityColor}; padding: 10px 20px; background-color: #f8fafc; border-radius: 0 12px 12px 0; margin-bottom: 24px;">
      <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.015em;">${title}</h3>
      <p style="margin: 0; font-size: 12px; color: #64748b; font-weight: bold;">Posted by: ${author} · Cohort Broadcast</p>
    </div>
    
    <div style="color: #475569; font-size: 15px; line-height: 1.7; white-space: pre-wrap; background-color: #ffffff; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      ${content}
    </div>
    
    <div style="text-align: center;">
      <a href="${config.frontend.url}/login" class="button">Launch Dashboard Portal</a>
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
    <span class="badge badge-info">Identity Verification</span>
    <h2 class="email-title">Authentication Code Request</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>A login request was initiated for your InternFlow workspace. Please use the following 6-digit secure authentication passcode to complete access verification:</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; padding: 18px 45px; background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); border: 2px dashed #3b82f6; border-radius: 16px; font-size: 38px; font-weight: 900; color: #1d4ed8; letter-spacing: 0.2em; text-align: center; font-family: 'Courier New', Courier, monospace;">
        ${otpCode}
      </div>
    </div>
    
    <div class="meta-box" style="margin-top: 24px; font-size: 13px; color: #475569; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;">
      <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">Security Audit Log details:</p>
      <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; font-weight: bold; color: #64748b;">Attempt Time:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #0f172a; text-align: right;">${timestamp}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: bold; color: #64748b;">IP Address:</td>
          <td style="padding: 4px 0; font-weight: 600; color: #0f172a; text-align: right;">${ipAddress}</td>
        </tr>
      </table>
    </div>
    
    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8; line-height: 1.5;">
      <strong>Confidentiality Advisory:</strong> This passcode is confidential and will expire in <strong>5 minutes</strong>. If you did not initiate this login request, please update your account password immediately to secure your access.
    </p>
  `;

  const html = getEmailWrapper('Secure Access Verification Code', body);

  // Proactive development fallback: if transporter is disabled or fails, log it clearly so local devs can proceed without working credentials
  if (!transporter) {
    logger.info(`[MOCK EMAIL DELIVERY] OTP for ${email} (${name}) is: ${otpCode}`);
    return true;
  }

  const success = await sendEmail(email, 'Secure Access Verification Code - InternFlow', html);
  if (!success) {
    logger.warn('SMTP Delivery failed, logging fallback OTP for development/debug access.');
    logger.info(`[FALLBACK EMAIL DELIVERY] OTP for ${email} (${name}) is: ${otpCode}`);
  }
  return true; // Return true so login flow can still proceed using fallback OTP from console
};
