import { emailService } from '../../services/email.service';

/**
 * Send email to Mentor when a new intern is assigned (after delay)
 */
export async function sendMentorEmail(
  to: string,
  mentorName: string,
  internName: string,
  department: string,
  matchScore: number,
  assignedDate: string
) {
  const subject = `New Intern Assigned: ${internName} | InternFlow`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background-color: #0f172a; padding: 32px 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
          .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .info-box { background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 28px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
          .info-value { font-size: 14px; font-weight: 600; color: #0f172a; }
          .btn-container { text-align: center; margin-bottom: 8px; }
          .btn { display: inline-block; background-color: #7c3aed; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 10px; text-decoration: none; transition: background-color 0.2s; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo" style="color: #ffffff; font-size: 24px; font-weight: bold;">InternFlow</div>
          </div>
          <div class="content">
            <h1 class="greeting">Hello ${mentorName},</h1>
            <p class="message">You have been assigned a new intern for Q2 Internship Cycle.</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Intern Name</span>
                <span class="info-value">${internName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Department</span>
                <span class="info-value">${department}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Match Score</span>
                <span class="info-value">${matchScore}%</span>
              </div>
              <div class="info-row">
                <span class="info-label">Assigned Date</span>
                <span class="info-value">${new Date(assignedDate).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div class="btn-container">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/mentor/dashboard" class="btn" style="color: #ffffff;">View Intern Profile</a>
            </div>
          </div>
          <div class="footer">
            InternFlow HR System — automated message
          </div>
        </div>
      </body>
    </html>
  `;

  return emailService.sendEmail(to, subject, html, 'MENTOR_PLACEMENT');
}

/**
 * Send email to Intern when their mentor is assigned (after delay)
 */
export async function sendInternEmail(
  to: string,
  internName: string,
  mentorName: string,
  department: string,
  matchScore: number
) {
  const subject = `Your Mentor is Assigned: ${mentorName} | InternFlow`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background-color: #0f172a; padding: 32px 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
          .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .info-box { background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 28px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
          .info-value { font-size: 14px; font-weight: 600; color: #0f172a; }
          .btn-container { text-align: center; margin-bottom: 8px; }
          .btn { display: inline-block; background-color: #7c3aed; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 10px; text-decoration: none; transition: background-color 0.2s; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo" style="color: #ffffff; font-size: 24px; font-weight: bold;">InternFlow</div>
          </div>
          <div class="content">
            <h1 class="greeting">Hello ${internName},</h1>
            <p class="message">Your mentor has been officially assigned!</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Mentor Name</span>
                <span class="info-value">${mentorName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Department</span>
                <span class="info-value">${department}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Match Score</span>
                <span class="info-value">${matchScore}%</span>
              </div>
            </div>
            
            <div class="btn-container">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/intern/dashboard" class="btn" style="color: #ffffff;">Schedule First Meeting</a>
            </div>
          </div>
          <div class="footer">
            InternFlow HR System — automated message
          </div>
        </div>
      </body>
    </html>
  `;

  return emailService.sendEmail(to, subject, html, 'INTERN_PLACEMENT');
}

/**
 * Send email to HR Admin when a placement is confirmed (immediate)
 */
export async function sendAdminEmail(
  to: string,
  internName: string,
  mentorName: string,
  department: string,
  matchScore: number,
  confidenceLevel: string,
  appliedAt: string,
  status: string
) {
  const subject = `Placement Confirmed: ${internName} → ${mentorName} | InternFlow`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; color: #1e293b; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background-color: #0f172a; padding: 32px 24px; text-align: center; }
          .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; }
          .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
          .info-box { background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 28px; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
          .info-row:last-child { border-bottom: none; }
          .info-label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
          .info-value { font-size: 14px; font-weight: 600; color: #0f172a; }
          .btn-container { text-align: center; margin-bottom: 8px; }
          .btn { display: inline-block; background-color: #7c3aed; color: #ffffff; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 10px; text-decoration: none; transition: background-color 0.2s; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo" style="color: #ffffff; font-size: 24px; font-weight: bold;">InternFlow</div>
          </div>
          <div class="content">
            <h1 class="greeting">Placement Confirmation</h1>
            <p class="message">A new placement mapping has been recorded.</p>
            
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Intern Placement</span>
                <span class="info-value">${internName} &rarr; ${mentorName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Department</span>
                <span class="info-value">${department}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Match Score</span>
                <span class="info-value">${matchScore}%</span>
              </div>
              <div class="info-row">
                <span class="info-label">Confidence Level</span>
                <span class="info-value">${confidenceLevel}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Applied At</span>
                <span class="info-value">${new Date(appliedAt).toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="info-value" style="color: ${status === 'Revoked' ? '#e11d48' : '#2563eb'}">${status}</span>
              </div>
            </div>
            
            <div class="btn-container">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/hr/ai-recommendations" class="btn" style="color: #ffffff;">View Placement History</a>
            </div>
          </div>
          <div class="footer">
            InternFlow HR System — automated message
          </div>
        </div>
      </body>
    </html>
  `;

  return emailService.sendEmail(to, subject, html, 'ADMIN_PLACEMENT');
}
