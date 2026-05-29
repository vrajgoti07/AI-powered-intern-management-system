export const welcomeTemplate = (data: any) => {
  return {
    subject: `Welcome to ${data.companyName || 'Our Company'} Internship Program`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome ${data.name}!</h2>
        <p>We are excited to have you join our Internship Program.</p>
        <p>Your login credentials:</p>
        <ul>
          <li>Email: ${data.email}</li>
          <li>Temporary Password: ${data.temporaryPassword}</li>
        </ul>
        <p>Please login at <a href="${data.loginUrl}">${data.loginUrl}</a> and change your password.</p>
      </div>
    `
  };
};

export const offerLetterTemplate = (data: any) => {
  return {
    subject: `Offer Letter: ${data.position} Internship`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Formal Offer Letter</h2>
        <p>Dear ${data.name},</p>
        <p>We are pleased to offer you the position of ${data.position} in the ${data.department} department.</p>
        <ul>
          <li>Start Date: ${data.startDate}</li>
          <li>End Date: ${data.endDate}</li>
          <li>Mentor: ${data.mentorName}</li>
          <li>HR Contact: ${data.hrName}</li>
        </ul>
        <p>Please log in to your dashboard to formally accept or decline this offer.</p>
      </div>
    `
  };
};

export const acceptanceConfirmationTemplate = (data: any) => {
  return {
    subject: `Offer Accepted - Welcome!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Offer Accepted</h2>
        <p>Dear ${data.name},</p>
        <p>We are glad you accepted the offer. Your onboarding process will begin shortly.</p>
      </div>
    `
  };
};

export const leaveApprovedTemplate = (data: any) => {
  return {
    subject: `Leave Request Approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Leave Approved</h2>
        <p>Hi ${data.name},</p>
        <p>Your ${data.leaveType} leave from ${data.startDate} to ${data.endDate} has been approved by ${data.approvedBy}.</p>
      </div>
    `
  };
};

export const leaveRejectedTemplate = (data: any) => {
  return {
    subject: `Leave Request Rejected`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Leave Rejected</h2>
        <p>Hi ${data.name},</p>
        <p>Your ${data.leaveType} leave request has been rejected.</p>
        <p>Reason: ${data.reason}</p>
      </div>
    `
  };
};

export const taskDeadlineReminderTemplate = (data: any) => {
  return {
    subject: `Reminder: Task Due Soon - ${data.taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Task Deadline Reminder</h2>
        <p>Hi ${data.name},</p>
        <p>Your task "<strong>${data.taskTitle}</strong>" is due in ${data.daysLeft} days (Due: ${data.dueDate}).</p>
        <p>Please submit it <a href="${data.taskUrl}">here</a>.</p>
      </div>
    `
  };
};

export const evaluationReminderTemplate = (data: any) => {
  return {
    subject: `Reminder: Evaluation Due on ${data.evaluationDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Evaluation Reminder</h2>
        <p>Hi ${data.name},</p>
        <p>Your evaluation is scheduled for ${data.evaluationDate}. Please complete the required form <a href="${data.formUrl}">here</a>.</p>
      </div>
    `
  };
};

export const certificateIssuedTemplate = (data: any) => {
  return {
    subject: `Congratulations! Your Certificate is Ready`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Certificate of Completion</h2>
        <p>Congratulations ${data.name}!</p>
        <p>You have successfully completed your internship as a ${data.position} in the ${data.department} department (from ${data.startDate} to ${data.endDate}).</p>
        <p>Download your certificate <a href="${data.pdfUrl}">here</a>.</p>
      </div>
    `
  };
};

export const weeklySummaryTemplate = (data: any) => {
  return {
    subject: `Weekly Performance Summary - Week ${data.weekNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Weekly Summary</h2>
        <p>Hi ${data.name},</p>
        <p>Here is your performance summary for week ${data.weekNumber}:</p>
        <ul>
          <li>Tasks Completed: ${data.tasksCompleted}</li>
          <li>Attendance Days: ${data.attendanceDays}</li>
          <li>Performance Score: ${data.performanceScore}</li>
          <li>Top Achievement: ${data.topAchievement || 'N/A'}</li>
        </ul>
        <p>Keep up the good work!</p>
      </div>
    `
  };
};

export const renderTemplate = (type: string, data: any): { subject: string; html: string } => {
  switch (type) {
    case 'WELCOME_EMAIL': return welcomeTemplate(data);
    case 'OFFER_LETTER': return offerLetterTemplate(data);
    case 'ACCEPTANCE_CONFIRMATION': return acceptanceConfirmationTemplate(data);
    case 'LEAVE_APPROVED': return leaveApprovedTemplate(data);
    case 'LEAVE_REJECTED': return leaveRejectedTemplate(data);
    case 'DEADLINE_REMINDER': return taskDeadlineReminderTemplate(data);
    case 'EVALUATION_REMINDER': return evaluationReminderTemplate(data);
    case 'CERTIFICATE_ISSUED': return certificateIssuedTemplate(data);
    case 'WEEKLY_SUMMARY': return weeklySummaryTemplate(data);
    default:
      return { subject: 'Notification', html: `<p>${JSON.stringify(data)}</p>` };
  }
};
