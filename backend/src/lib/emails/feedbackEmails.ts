import { safeAddJob } from '../../queues/notification.queue';
import { config } from '../../config/env';

/**
 * Premium email template wrapper
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
        padding: 30px 40px 20px 40px; 
        border-bottom: 1px solid #f1f5f9;
      }
      .logo-text {
        font-size: 18px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.03em;
      }
      .logo-dot {
        color: #4f46e5;
      }
      .content { 
        padding: 35px 40px; 
      }
      .email-title {
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;
        margin-top: 0;
        margin-bottom: 20px;
      }
      .button { 
        display: inline-block; 
        padding: 12px 28px; 
        background: #4f46e5; 
        color: #ffffff !important; 
        text-decoration: none !important; 
        border-radius: 10px; 
        font-weight: 700; 
        text-align: center; 
        font-size: 13px;
        margin: 20px 0;
      }
      .footer { 
        text-align: center; 
        padding: 24px 40px; 
        background-color: #f8fafc; 
        color: #94a3b8; 
        font-size: 11px; 
        border-top: 1px solid #f1f5f9; 
      }
      p { 
        margin: 0 0 16px 0; 
        color: #475569; 
        font-size: 14px; 
      }
      strong { 
        color: #0f172a; 
      }
      .badge {
        display: inline-block;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 800;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .badge-positive {
        background-color: #ecfdf5;
        color: #047857;
        border: 1px solid #a7f3d0;
      }
      .badge-neutral {
        background-color: #fffbeb;
        color: #b45309;
        border: 1px solid #fde68a;
      }
      .badge-negative {
        background-color: #fef2f2;
        color: #b91c1c;
        border: 1px solid #fecaca;
      }
      .quote-box {
        margin: 20px 0;
        padding: 16px;
        background-color: #f8fafc;
        border-left: 4px solid #e2e8f0;
        border-radius: 0 8px 8px 0;
        font-style: italic;
        color: #475569;
        font-size: 13.5px;
      }
    </style>
  </head>
  <body>
    <div class="email-bg">
      <div class="container">
        <div class="brand-accent"></div>
        <div class="header">
          <div style="float: right; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px;">${title}</div>
          <div class="logo-text">InternFlow<span class="logo-dot">•</span></div>
          <div style="clear: both;"></div>
        </div>
        <div class="content">
          ${bodyContent}
        </div>
        <div class="footer">
          This is an automated operational transmission from InternFlow. Do not reply directly to this email.<br>
          © 2026 InternFlow Inc. · One Hacker Way · Palo Alto, CA
        </div>
      </div>
    </div>
  </body>
  </html>
`;

/**
 * Send email when mentor submits feedback for an intern (encouraging tone)
 */
export const sendFeedbackSubmittedEmail = async (
  to: string,
  internName: string,
  mentorName: string,
  comment: string,
  rating: number,
  sentiment: string
): Promise<boolean> => {
  const badgeClass = sentiment.toLowerCase() === 'positive' 
    ? 'badge-positive' 
    : sentiment.toLowerCase() === 'negative' 
    ? 'badge-negative' 
    : 'badge-neutral';

  const bodyContent = `
    <h2 class="email-title">Your Evaluation Feedback is Available</h2>
    <p>Hi ${internName},</p>
    <p>Your mentor, <strong>${mentorName}</strong>, has submitted a new review evaluation for your profile. Here is a summary of the assessment:</p>
    
    <table style="width:100%; border-collapse: collapse; margin: 20px 0; font-size: 13.5px;">
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b; font-weight: 600;">Rating</td>
        <td style="padding: 10px 0; color: #0f172a; font-weight: 700;">${rating} / 5 Stars</td>
      </tr>
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 0; color: #64748b; font-weight: 600;">AI Analysis Tone</td>
        <td style="padding: 10px 0;">
          <span class="badge ${badgeClass}">${sentiment}</span>
        </td>
      </tr>
    </table>

    <p><strong>Mentor Remarks:</strong></p>
    <div class="quote-box">
      "${comment}"
    </div>

    <p>We encourage you to review the insights dashboard and checklist items generated to assist your growth journey.</p>
    
    <div style="text-align: center;">
      <a href="${config.frontend.url}/shared/ai-feedback" class="button">Access Feedback Dashboard</a>
    </div>
  `;

  const html = getEmailWrapper('Evaluation Submission', bodyContent);
  const success = await safeAddJob('send_email', {
    to,
    subject: `[InternFlow] New Mentor Evaluation Feedback from ${mentorName}`,
    html,
  });

  return !!success;
};

/**
 * Send email to intern when an action item is created
 */
export const sendActionItemCreatedEmail = async (
  to: string,
  internName: string,
  task: string
): Promise<boolean> => {
  const bodyContent = `
    <h2 class="email-title">New Recommended Action Item</h2>
    <p>Hi ${internName},</p>
    <p>Based on your recent mentor evaluations, the AI evaluation system has suggested a new action recommendation to help optimize your training track:</p>
    
    <div style="background-color: #f8fafc; border: 1px dashed #e2e8f0; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center; font-size: 14px; font-weight: 700; color: #4f46e5;">
      "${task}"
    </div>

    <p>This item has been added to your interactive dashboard. You can log in to update your progress status (Todo, In Progress, Complete).</p>

    <div style="text-align: center;">
      <a href="${config.frontend.url}/shared/ai-feedback" class="button">View Dashboard Checklist</a>
    </div>
  `;

  const html = getEmailWrapper('Action Recommended', bodyContent);
  const success = await safeAddJob('send_email', {
    to,
    subject: `[InternFlow] New Recommended Action Item Created`,
    html,
  });

  return !!success;
};

/**
 * Send email confirming action item completion to mentor / HR
 */
export const sendActionItemCompletedEmail = async (
  to: string,
  internName: string,
  mentorName: string,
  task: string
): Promise<boolean> => {
  const bodyContent = `
    <h2 class="email-title">Action Item Completed</h2>
    <p>Hi ${mentorName},</p>
    <p>Your assigned intern, <strong>${internName}</strong>, has successfully checked off and completed the following recommended action item:</p>
    
    <div style="background-color: #f0fdf4; border: 1px solid #bcf0da; border-radius: 12px; padding: 18px; margin: 20px 0; font-size: 13.5px; font-weight: 600; color: #03543f;">
      <span style="font-size: 16px; margin-right: 6px;">✓</span> ${task}
    </div>

    <p>This accomplishment has been updated in the AI Insights logs. You can review their full progress dashboard at any time.</p>

    <div style="text-align: center;">
      <a href="${config.frontend.url}/shared/ai-feedback" class="button">Open HR Dashboard</a>
    </div>
  `;

  const html = getEmailWrapper('Action Completed', bodyContent);
  const success = await safeAddJob('send_email', {
    to,
    subject: `[InternFlow] Action Completed: ${internName} finished task`,
    html,
  });

  return !!success;
};
