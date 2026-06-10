import prisma from '../config/database';
import { logger } from '../utils/logger';
import { sendWeeklyDigestEmail } from '../utils/email';
import aiService from './ai.service';
import dayjs from 'dayjs';

export class WeeklyDigestService {
  /**
   * Helper to get start and end dates of the last 7 days
   */
  private getWeekRange() {
    const endOfWeek = new Date();
    // Monday morning 9 AM, we run for previous 7 days (Monday morning to Sunday night)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    
    const startStr = dayjs(startOfWeek).format('MMM D, YYYY');
    const endStr = dayjs(endOfWeek).format('MMM D, YYYY');
    
    return {
      startOfWeek,
      endOfWeek,
      weekRangeStr: `${startStr} – ${endStr}`
    };
  }

  /**
   * 1. Gather Telemetry for an Intern
   */
  async gatherInternTelemetry(internId: string, startOfWeek: Date, endOfWeek: Date) {
    // Tasks stats
    const tasks = await prisma.task.findMany({
      where: {
        internId,
        updatedAt: { gte: startOfWeek, lte: endOfWeek }
      }
    });
    
    const tasksTotal = tasks.length;
    const tasksCompleted = tasks.filter(t => t.status === 'COMPLETED').length;
    const completionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
    
    // Average task review score
    const feedbacks = await prisma.feedback.findMany({
      where: {
        internId,
        createdAt: { gte: startOfWeek, lte: endOfWeek }
      }
    });
    const avgScore = feedbacks.length > 0
      ? Number((feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1))
      : 0;

    // Attendance stats
    const attendances = await prisma.attendance.findMany({
      where: {
        internId,
        date: { gte: startOfWeek, lte: endOfWeek }
      }
    });
    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100; // default to 100 if no logs

    // Daily standup moods & blockers
    const standups = await prisma.dailyStandup.findMany({
      where: {
        internId,
        date: { gte: startOfWeek, lte: endOfWeek }
      }
    });
    
    const moodCounts = standups.reduce((acc: Record<string, number>, s) => {
      acc[s.mood] = (acc[s.mood] || 0) + 1;
      return acc;
    }, {});
    
    const blockers = standups.map(s => s.blockers).filter(Boolean) as string[];

    return {
      tasksTotal,
      tasksCompleted,
      completionRate,
      avgScore,
      totalDays,
      presentDays,
      attendanceRate,
      standupsCount: standups.length,
      moodCounts,
      blockers
    };
  }

  /**
   * 2. Gather Telemetry for a Mentor
   */
  async gatherMentorTelemetry(mentorId: string, startOfWeek: Date, endOfWeek: Date) {
    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      include: {
        interns: {
          include: {
            user: true
          }
        }
      }
    });

    if (!mentor) {
      throw new Error(`Mentor not found: ${mentorId}`);
    }

    const internSummaries = [];
    let totalOverdue = 0;
    let totalAtRisk = 0;

    for (const intern of mentor.interns) {
      const telemetry = await this.gatherInternTelemetry(intern.id, startOfWeek, endOfWeek);
      
      // Calculate overdue tasks
      const overdueTasks = await prisma.task.findMany({
        where: {
          internId: intern.id,
          status: { not: 'COMPLETED' },
          dueDate: { lt: new Date() }
        },
        select: {
          title: true,
          dueDate: true
        }
      });

      const isAtRisk = telemetry.attendanceRate < 80 || telemetry.avgScore < 6.0 || overdueTasks.length > 0;
      if (overdueTasks.length > 0) totalOverdue += overdueTasks.length;
      if (isAtRisk) totalAtRisk++;

      internSummaries.push({
        internId: intern.id,
        name: intern.user.name,
        completionRate: telemetry.completionRate,
        avgScore: telemetry.avgScore,
        attendanceRate: telemetry.attendanceRate,
        overdueCount: overdueTasks.length,
        isAtRisk
      });
    }

    return {
      internsCount: mentor.interns.length,
      overdueTasksCount: totalOverdue,
      atRiskCount: totalAtRisk,
      interns: internSummaries
    };
  }

  /**
   * 3. Gather Telemetry for HR (Organization-wide)
   */
  async gatherHRTelemetry(organizationId: string | null, startOfWeek: Date, endOfWeek: Date) {
    const activeInterns = await prisma.intern.findMany({
      where: {
        status: 'ACTIVE',
        organizationId: organizationId || undefined
      },
      include: {
        user: true
      }
    });

    const activeMentors = await prisma.mentor.count({
      where: {
        organizationId: organizationId || undefined
      }
    });

    let totalTasksAssigned = 0;
    let totalTasksCompleted = 0;
    let totalScoreSum = 0;
    let scoreCount = 0;
    const atRiskInterns = [];

    for (const intern of activeInterns) {
      const telemetry = await this.gatherInternTelemetry(intern.id, startOfWeek, endOfWeek);
      
      totalTasksAssigned += telemetry.tasksTotal;
      totalTasksCompleted += telemetry.tasksCompleted;
      
      if (telemetry.avgScore > 0) {
        totalScoreSum += telemetry.avgScore;
        scoreCount++;
      }

      // Identify at-risk interns
      const overdueTasksCount = await prisma.task.count({
        where: {
          internId: intern.id,
          status: { not: 'COMPLETED' },
          dueDate: { lt: new Date() }
        }
      });

      const isAtRisk = telemetry.attendanceRate < 80 || telemetry.avgScore < 6.0 || overdueTasksCount > 0;
      if (isAtRisk) {
        atRiskInterns.push({
          internId: intern.id,
          name: intern.user.name,
          attendanceRate: telemetry.attendanceRate,
          avgScore: telemetry.avgScore,
          overdueCount: overdueTasksCount,
          reason: telemetry.attendanceRate < 80 
            ? 'Low attendance (< 80%)' 
            : telemetry.avgScore < 6.0 
            ? 'Low task ratings (< 6/10)' 
            : 'Overdue milestone tasks'
        });
      }
    }

    const taskCompletionRate = totalTasksAssigned > 0 ? Math.round((totalTasksCompleted / totalTasksAssigned) * 100) : 0;
    const avgScore = scoreCount > 0 ? Number((totalScoreSum / scoreCount).toFixed(1)) : 0;

    return {
      activeInternsCount: activeInterns.length,
      activeMentorsCount: activeMentors,
      taskCompletionRate,
      avgScore,
      atRiskCount: atRiskInterns.length,
      atRiskInterns
    };
  }

  /**
   * 4. Generate AI Digest Copy via OpenAI GPT-4o-mini
   */
  async generateAIDigest(role: string, name: string, data: any): Promise<string> {
    const systemPrompt = `You are a helpful, professional HR and program management assistant for InternFlow, an AI-powered intern tracking platform. Your goal is to write a weekly performance digest summary. Keep the tone premium, motivating, clear, and professional. Avoid formatting like markdown bold or bullet lists. Return ONLY a plain text paragraph, max 4 sentences.`;
    
    let userPrompt = '';
    if (role === 'INTERN') {
      userPrompt = `Generate a weekly summary for intern named ${name}. This week, they completed ${data.tasksCompleted} of ${data.tasksTotal} assigned tasks. Their average review score is ${data.avgScore}/10 and attendance rate is ${data.attendanceRate}%. Standups count: ${data.standupsCount}. Active blockers: ${data.blockers.join(', ') || 'None'}. Provide positive reinforcement and 1 brief tip for next week.`;
    } else if (role === 'MENTOR') {
      userPrompt = `Generate a weekly overview for mentor named ${name}. They supervise ${data.internsCount} active interns. Over the last 7 days, there are ${data.overdueTasksCount} overdue tasks and ${data.atRiskCount} at-risk interns under their guidance. Provide actionable coaching advice to address these flags and support their cohort.`;
    } else {
      userPrompt = `Generate a weekly executive cohort digest for HR representative named ${name}. The organization has ${data.activeInternsCount} active interns and ${data.activeMentorsCount} mentors. Overall task completion rate is ${data.taskCompletionRate}% with an average performance rating of ${data.avgScore}/10. Currently, ${data.atRiskCount} interns are flagged as at-risk. Provide a clear high-level assessment and a programmatic recommendation.`;
    }

    try {
      const response = await aiService.generateText(systemPrompt, userPrompt);
      return response.trim();
    } catch (error) {
      logger.warn(`Weekly digest AI generation failed for ${name}. Using local rule-based fallback...`);
      return this.generateLocalFallbackDigest(role, name, data);
    }
  }

  /**
   * 5. Generate Local Fallback copy if OpenAI is offline
   */
  generateLocalFallbackDigest(role: string, name: string, data: any): string {
    if (role === 'INTERN') {
      const taskText = data.tasksTotal > 0
        ? `You completed ${data.tasksCompleted} out of ${data.tasksTotal} tasks this week, achieving a task completion rate of ${data.completionRate}%.`
        : `No new task milestones were graded this week.`;
      const scoreText = data.avgScore > 0
        ? `Your mentor gave you an average rating of ${data.avgScore} out of 10 on your graded submissions.`
        : `Make sure to coordinate with your mentor to review pending task grades.`;
      const blockerText = data.blockers.length > 0
        ? `We noticed you flagged blockers: "${data.blockers[0]}". Don't hesitate to reach out to your mentor for guidance.`
        : `Great job keeping your workspace clean of active blockers.`;

      return `Hi ${name}! ${taskText} ${scoreText} Your weekly attendance rate is evaluated at ${data.attendanceRate}%. ${blockerText} Keep up the focus and strive for consistent milestone delivery next week.`;
    } else if (role === 'MENTOR') {
      const riskText = data.atRiskCount > 0
        ? `Currently, ${data.atRiskCount} of your assigned interns have flags (overdue tasks, low attendance, or low ratings). We recommend scheduling a brief 1-on-1 check-in to align on objectives.`
        : `All interns under your supervision are in stable status with healthy performance parameters.`;

      return `Hi ${name}! You are supervising ${data.internsCount} active interns in your department. ${riskText} Direct task boards have a total of ${data.overdueTasksCount} overdue milestones. Thank you for your continued leadership and support.`;
    } else {
      const riskText = data.atRiskCount > 0
        ? `There are currently ${data.atRiskCount} interns flagged as at-risk. The primary factors include low attendance rates or outstanding overdue tasks.`
        : `Excellent! No interns are flagged as at-risk this week.`;

      return `Hello HR Team! The program is operating with ${data.activeInternsCount} active interns and ${data.activeMentorsCount} mentors. Overall task completion rate stands at ${data.taskCompletionRate}% with an average performance score of ${data.avgScore}/10. ${riskText} Recommend checking the risk detection dashboard for detailed cohort statistics.`;
    }
  }

  /**
   * Helper to format statistics into HTML tables for Nodemailer template
   */
  private getMetricsHtml(role: string, data: any): string {
    if (role === 'INTERN') {
      return `
        <table style="width:100%; font-size:14px; border-collapse:collapse; color:#334155;">
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; font-weight:600; color:#475569;">Tasks Completed</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#10b981;">${data.tasksCompleted} / ${data.tasksTotal} (${data.completionRate}%)</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; font-weight:600; color:#475569;">Average Task Grade</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#4f46e5;">${data.avgScore > 0 ? `${data.avgScore} / 10` : 'N/A'}</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; font-weight:600; color:#475569;">Attendance Rate</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#f59e0b;">${data.attendanceRate}%</td></tr>
          <tr><td style="padding:10px 0; font-weight:600; color:#475569;">Standups Submitted</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#64748b;">${data.standupsCount}</td></tr>
        </table>
      `;
    } else if (role === 'MENTOR') {
      return `
        <table style="width:100%; font-size:14px; border-collapse:collapse; color:#334155;">
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; font-weight:600; color:#475569;">Assigned Interns</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#64748b;">${data.internsCount} active</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; font-weight:600; color:#475569;">Overdue Tasks</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#ef4444;">${data.overdueTasksCount} tasks</td></tr>
          <tr><td style="padding:10px 0; font-weight:600; color:#475569;">At-Risk Interns</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#ef4444;">${data.atRiskCount} detected</td></tr>
        </table>
      `;
    } else {
      return `
        <table style="width:100%; font-size:14px; border-collapse:collapse; color:#334155;">
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; font-weight:600; color:#475569;">Active Program Cohort</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#64748b;">${data.activeInternsCount} Interns / ${data.activeMentorsCount} Mentors</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; font-weight:600; color:#475569;">Overall Task Completion</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#10b981;">${data.taskCompletionRate}%</td></tr>
          <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:10px 0; font-weight:600; color:#475569;">Average Performance Score</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#4f46e5;">${data.avgScore} / 10</td></tr>
          <tr><td style="padding:10px 0; font-weight:600; color:#475569;">Cohort At-Risk Count</td><td style="padding:10px 0; text-align:right; font-weight:700; color:#ef4444;">${data.atRiskCount} Flagged</td></tr>
        </table>
      `;
    }
  }

  /**
   * 6. Generate and send digest for a specific user (Email + In-app notification with raw data payload)
   */
  async sendDigest(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        intern: true,
        mentor: true
      }
    });

    if (!user || !user.isActive) {
      return;
    }

    const { startOfWeek, endOfWeek, weekRangeStr } = this.getWeekRange();
    let telemetryData: any = null;
    let roleTitle = 'System Digest';
    const role = user.role;

    // A. Gather telemetry by role
    if (role === 'INTERN' && user.intern) {
      telemetryData = await this.gatherInternTelemetry(user.intern.id, startOfWeek, endOfWeek);
      roleTitle = 'Intern Performance Digest';
    } else if (role === 'MENTOR' && user.mentor) {
      telemetryData = await this.gatherMentorTelemetry(user.mentor.id, startOfWeek, endOfWeek);
      roleTitle = 'Mentor Supervision Digest';
    } else if (role === 'HR' || role === 'SUPER_ADMIN') {
      telemetryData = await this.gatherHRTelemetry(user.organizationId, startOfWeek, endOfWeek);
      roleTitle = 'HR Workspace Digest';
    } else {
      // Return if user role does not participate
      return;
    }

    // B. Generate AI Insight
    const aiInsight = await this.generateAIDigest(role, user.name, telemetryData);

    // C. Save weekly digest to notification log table with full serialized data payload
    const digestData = {
      role,
      weekRange: weekRangeStr,
      telemetry: telemetryData,
      aiInsight
    };

    await prisma.notification.create({
      data: {
        userId: user.id,
        organizationId: user.organizationId,
        title: `📊 Weekly AI Performance Digest`,
        message: `Your weekly AI-generated digest is ready. Click to view performance metrics, warnings, and recommendations.`,
        type: 'DIGEST',
        data: digestData
      }
    });

    // D. Dispatch responsive HTML email
    if (user.email) {
      const metricsHtml = this.getMetricsHtml(role, telemetryData);
      try {
        await sendWeeklyDigestEmail(user.email, user.name, roleTitle, weekRangeStr, metricsHtml, aiInsight);
        logger.info(`Weekly performance email digest dispatched to user ${user.email} (${role})`);
      } catch (err: any) {
        logger.error(`Failed to dispatch weekly performance email to ${user.email}: ${err.message}`);
      }
    }
  }

  /**
   * 7. Dispatch Weekly Digests to all active users with matching preferences
   */
  async sendDigestToAllUsers(organizationId: string | null = null) {
    logger.info(`Initializing organization weekly performance AI digests dispatch...`);
    
    // Find all active users with digest preference toggled ON
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        organizationId: organizationId || undefined,
        notificationPreference: {
          weeklyDigest: true
        }
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    logger.info(`Discovered ${users.length} active users subscribing to weekly performance AI digests.`);

    let successCount = 0;
    for (const user of users) {
      try {
        await this.sendDigest(user.id);
        successCount++;
      } catch (err: any) {
        logger.error(`Failed to generate/send digest for user ID ${user.id}: ${err.message}`);
      }
    }

    logger.info(`Successfully completed weekly AI digests batch dispatch: ${successCount} / ${users.length} completed.`);
    return { total: users.length, sent: successCount };
  }
}

export default new WeeklyDigestService();
