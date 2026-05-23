import prisma from '../config/database';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// --- Type Definitions ---

export interface PerformanceReportData {
  intern: Record<string, any>;
  taskStats: Record<string, any>;
  attendanceStats: Record<string, any>;
  feedbackStats: Record<string, any>;
  performanceScore: number;
  aiPrediction: Record<string, any> | null;
}

export interface AttendanceReportData {
  intern: Record<string, any>;
  records: Array<Record<string, any>>;
  summary: Record<string, any>;
}

export interface InternshipSummaryData {
  intern: Record<string, any>;
  department: Record<string, any>;
  mentor: Record<string, any> | null;
  performance: Record<string, any>;
  eligibleForCompletion: boolean;
}

// --- Report Service ---

export class ReportService {
  /**
   * Generate a comprehensive performance report for an intern
   */
  async getPerformanceReport(internId: string): Promise<PerformanceReportData> {
    try {
      const intern = await prisma.intern.findUnique({
        where: { id: internId },
        include: {
          user: { select: { name: true, email: true } },
          department: { select: { name: true } },
          mentor: { include: { user: { select: { name: true } } } },
          tasks: true,
          feedbacks: true,
        },
      });

      if (!intern) {
        throw new Error('Intern not found');
      }

      // Task statistics
      const totalTasks = intern.tasks.length;
      const completedTasks = intern.tasks.filter((t) => t.status === 'COMPLETED').length;
      const inProgressTasks = intern.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const reviewTasks = intern.tasks.filter((t) => t.status === 'REVIEW').length;
      const todoTasks = intern.tasks.filter((t) => t.status === 'TODO').length;
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Overdue tasks
      const now = new Date();
      const overdueTasks = intern.tasks.filter(
        (t) => t.status !== 'COMPLETED' && new Date(t.dueDate) < now
      ).length;

      // Attendance statistics
      const attendanceRecords = await prisma.attendance.findMany({
        where: { internId },
        orderBy: { date: 'desc' },
      });

      const totalAttendance = attendanceRecords.length;
      const presentDays = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
      const absentDays = attendanceRecords.filter((a) => a.status === 'ABSENT').length;
      const halfDays = attendanceRecords.filter((a) => a.status === 'HALF_DAY').length;
      const leaveDays = attendanceRecords.filter((a) => a.status === 'LEAVE').length;
      const attendanceRate = totalAttendance > 0
        ? Math.round((presentDays / totalAttendance) * 100)
        : 0;

      // Feedback statistics
      const totalFeedbacks = intern.feedbacks.length;
      const avgRating = totalFeedbacks > 0
        ? Math.round((intern.feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks) * 10) / 10
        : 0;

      // Category breakdown
      const categoryRatings: Record<string, { total: number; count: number }> = {};
      intern.feedbacks.forEach((f) => {
        const cat = f.category || 'General';
        if (!categoryRatings[cat]) categoryRatings[cat] = { total: 0, count: 0 };
        categoryRatings[cat].total += f.rating;
        categoryRatings[cat].count += 1;
      });
      const categoryAvg: Record<string, number> = {};
      Object.entries(categoryRatings).forEach(([cat, { total, count }]) => {
        categoryAvg[cat] = Math.round((total / count) * 10) / 10;
      });

      // Performance score: 40% task completion + 30% attendance + 30% feedback
      const performanceScore = Math.round(
        (taskCompletionRate / 100) * 40 +
        (attendanceRate / 100) * 30 +
        (avgRating / 5) * 30
      );

      // AI prediction (with FastAPI fallback)
      let aiPrediction: Record<string, any> | null = null;
      try {
        const response = await fetch(`${config.ai.serviceUrl}/api/ai/predict-performance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attendance_rate: attendanceRate / 100,
            task_completion_rate: taskCompletionRate / 100,
            feedback_sentiment_score: (avgRating - 2.5) / 2.5,
            productivity_score: taskCompletionRate / 100,
          }),
        });

        if (response.ok) {
          const data = await response.json() as any;
          aiPrediction = {
            predictedGrade: data.predicted_performance_grade,
            predictedScore: data.predicted_score,
            riskLevel: data.risk_level,
            keyDrivers: data.key_drivers,
            suggestions: data.reconciliation_suggestions,
          };
        }
      } catch {
        logger.warn('AI service offline. Skipping AI prediction in performance report.');
      }

      return {
        intern: {
          id: intern.id,
          name: intern.user?.name || 'N/A',
          email: intern.user?.email || 'N/A',
          department: intern.department?.name || 'N/A',
          mentor: intern.mentor?.user?.name || 'N/A',
          status: intern.status,
          joinedDate: intern.joinedDate,
          college: intern.college,
          cgpa: intern.cgpa,
          skills: intern.skills,
        },
        taskStats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          reviewTasks,
          todoTasks,
          overdueTasks,
          taskCompletionRate,
        },
        attendanceStats: {
          totalDays: totalAttendance,
          presentDays,
          absentDays,
          halfDays,
          leaveDays,
          attendanceRate,
        },
        feedbackStats: {
          totalFeedbacks,
          avgRating,
          categoryAvg,
        },
        performanceScore,
        aiPrediction,
      };
    } catch (error) {
      logger.error('Performance report generation error:', error);
      throw error;
    }
  }

  /**
   * Generate an attendance report for an intern within a date range
   */
  async getAttendanceReport(
    internId: string,
    startDate?: string,
    endDate?: string
  ): Promise<AttendanceReportData> {
    try {
      const intern = await prisma.intern.findUnique({
        where: { id: internId },
        include: {
          user: { select: { name: true, email: true } },
          department: { select: { name: true } },
        },
      });

      if (!intern) {
        throw new Error('Intern not found');
      }

      // Default to current month
      const now = new Date();
      const start = startDate
        ? new Date(startDate)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = endDate
        ? new Date(endDate)
        : new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const records = await prisma.attendance.findMany({
        where: {
          internId,
          date: { gte: start, lte: end },
        },
        orderBy: { date: 'asc' },
      });

      const presentCount = records.filter((r) => r.status === 'PRESENT').length;
      const absentCount = records.filter((r) => r.status === 'ABSENT').length;
      const halfDayCount = records.filter((r) => r.status === 'HALF_DAY').length;
      const leaveCount = records.filter((r) => r.status === 'LEAVE').length;

      return {
        intern: {
          id: intern.id,
          name: intern.user?.name || 'N/A',
          email: intern.user?.email || 'N/A',
          department: intern.department?.name || 'N/A',
        },
        records: records.map((r) => ({
          date: r.date,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          status: r.status,
          notes: r.notes,
        })),
        summary: {
          totalDays: records.length,
          present: presentCount,
          absent: absentCount,
          halfDay: halfDayCount,
          leave: leaveCount,
          attendanceRate: records.length > 0
            ? Math.round((presentCount / records.length) * 100)
            : 0,
          dateRange: {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          },
        },
      };
    } catch (error) {
      logger.error('Attendance report generation error:', error);
      throw error;
    }
  }

  /**
   * Generate an internship summary with graduation eligibility
   */
  async getInternshipSummary(internId: string): Promise<InternshipSummaryData> {
    try {
      const intern = await prisma.intern.findUnique({
        where: { id: internId },
        include: {
          user: { select: { name: true, email: true } },
          department: true,
          mentor: { include: { user: { select: { name: true } } } },
          tasks: true,
          feedbacks: { select: { rating: true } },
        },
      });

      if (!intern) {
        throw new Error('Intern not found');
      }

      // Compute performance metrics
      const totalTasks = intern.tasks.length;
      const completedTasks = intern.tasks.filter((t) => t.status === 'COMPLETED').length;
      const taskCompletionRate = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

      const totalFeedbacks = intern.feedbacks.length;
      const avgRating = totalFeedbacks > 0
        ? Math.round((intern.feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks) * 10) / 10
        : 0;

      // Attendance stats
      const attendanceRecords = await prisma.attendance.findMany({
        where: { internId },
      });
      const totalDays = attendanceRecords.length;
      const presentDays = attendanceRecords.filter((a) => a.status === 'PRESENT').length;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      // Leave stats
      const leaves = await prisma.leave.findMany({ where: { internId } });
      const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED').length;

      // Eligibility: task completion >= 60%, attendance >= 70%, avg rating >= 2.5
      const eligibleForCompletion =
        taskCompletionRate >= 60 && attendanceRate >= 70 && avgRating >= 2.5;

      // Performance score
      const performanceScore = Math.round(
        (taskCompletionRate / 100) * 40 +
        (attendanceRate / 100) * 30 +
        (avgRating / 5) * 30
      );

      return {
        intern: {
          id: intern.id,
          name: intern.user?.name || 'N/A',
          email: intern.user?.email || 'N/A',
          college: intern.college,
          degree: intern.degree,
          branch: intern.branch,
          cgpa: intern.cgpa,
          skills: intern.skills,
          status: intern.status,
          joinedDate: intern.joinedDate,
          completedDate: intern.completedDate,
          duration: intern.duration,
        },
        department: {
          id: intern.department?.id,
          name: intern.department?.name || 'N/A',
        },
        mentor: intern.mentor
          ? {
              id: intern.mentor.id,
              name: intern.mentor.user?.name || 'N/A',
            }
          : null,
        performance: {
          performanceScore,
          taskCompletionRate,
          attendanceRate,
          avgFeedbackRating: avgRating,
          totalTasks,
          completedTasks,
          totalFeedbacks,
          totalAttendanceDays: totalDays,
          presentDays,
          approvedLeaves,
        },
        eligibleForCompletion,
      };
    } catch (error) {
      logger.error('Internship summary generation error:', error);
      throw error;
    }
  }
}

export default new ReportService();
