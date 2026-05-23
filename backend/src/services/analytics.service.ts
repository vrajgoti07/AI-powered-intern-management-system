import prisma from '../config/database';
import { logger } from '../utils/logger';
import { normalizeToUtcMidnight } from '../utils/date';

// --- Type Definitions ---

export interface DateRangeFilter {
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsFilter extends DateRangeFilter {
  departmentId?: string;
  internId?: string;
  mentorId?: string;
}

export interface DashboardStats {
  overview: Record<string, any>;
  recentActivity: Record<string, any>;
}

export interface InternAnalyticsResult {
  totalInterns: number;
  statusDistribution: Record<string, number>;
  avgAttendance: number;
  avgScore: number;
  taskCompletionRate: number;
  departmentDistribution: Array<{ department: string; count: number }>;
  topPerformers: Array<Record<string, any>>;
  skillsDistribution: Record<string, number>;
}

export interface MentorAnalyticsResult {
  totalMentors: number;
  avgRating: number;
  mentorProfiles: Array<Record<string, any>>;
  feedbackStats: Record<string, any>;
}

export interface DepartmentAnalyticsResult {
  totalDepartments: number;
  departments: Array<Record<string, any>>;
}

export interface TaskAnalyticsResult {
  totalTasks: number;
  statusDistribution: Record<string, number>;
  priorityDistribution: Record<string, number>;
  avgCompletionRate: number;
  overdueCount: number;
  recentTasks: Array<Record<string, any>>;
}

// --- Helper: Build Date Filter ---

function buildDateFilter(filter: DateRangeFilter): { gte?: Date; lte?: Date } | undefined {
  const clause: { gte?: Date; lte?: Date } = {};
  if (filter.startDate) clause.gte = new Date(filter.startDate);
  if (filter.endDate) clause.lte = new Date(filter.endDate);
  return Object.keys(clause).length > 0 ? clause : undefined;
}

// --- Analytics Service ---

export class AnalyticsService {
  /**
   * Get role-specific dashboard statistics
   */
  async getDashboardStats(user: any): Promise<DashboardStats> {
    try {
      const role: string = user.role;

      // Common counts
      const [totalInterns, totalMentors, totalDepartments, totalTasks] = await Promise.all([
        prisma.intern.count(),
        prisma.mentor.count(),
        prisma.department.count(),
        prisma.task.count(),
      ]);

      // Today's attendance
      const today = normalizeToUtcMidnight();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayAttendance = await prisma.attendance.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: 'PRESENT',
        },
      });

      const activeInterns = await prisma.intern.count({ where: { status: 'ACTIVE' } });
      const attendanceRate = activeInterns > 0 ? Math.round((todayAttendance / activeInterns) * 100) : 0;

      // Task stats
      const completedTasks = await prisma.task.count({ where: { status: 'COMPLETED' } });
      const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Pending leaves
      const pendingLeaves = await prisma.leave.count({ where: { status: 'PENDING' } });

      // Recent tasks (last 5)
      const recentTasks = await prisma.task.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          intern: { include: { user: { select: { name: true } } } },
        },
      });

      // Build role-specific overview
      let overview: Record<string, any> = {
        totalInterns,
        totalMentors,
        totalDepartments,
        totalTasks,
        completedTasks,
        taskCompletionRate,
        todayAttendance,
        attendanceRate,
        pendingLeaves,
        activeInterns,
      };

      if (role === 'MENTOR' && user.mentor) {
        const mentorId = user.mentor.id;
        const assignedInterns = await prisma.intern.count({ where: { mentorId } });
        const pendingReviews = await prisma.task.count({
          where: { mentorId, status: 'REVIEW' },
        });
        const mentorFeedbackCount = await prisma.feedback.count({ where: { mentorId } });

        overview = {
          ...overview,
          assignedInterns,
          pendingReviews,
          feedbackGiven: mentorFeedbackCount,
        };
      }

      if (role === 'INTERN' && user.intern) {
        const internId = user.intern.id;
        const myTasks = await prisma.task.count({ where: { internId } });
        const myCompleted = await prisma.task.count({ where: { internId, status: 'COMPLETED' } });
        const myPendingLeaves = await prisma.leave.count({ where: { internId, status: 'PENDING' } });

        const myAttendanceRecords = await prisma.attendance.count({
          where: { internId, status: 'PRESENT' },
        });
        const myTotalAttendance = await prisma.attendance.count({ where: { internId } });
        const myAttendanceRate = myTotalAttendance > 0
          ? Math.round((myAttendanceRecords / myTotalAttendance) * 100)
          : 0;

        const feedbackReceived = await prisma.feedback.findMany({
          where: { internId },
          select: { rating: true },
        });
        const avgRating = feedbackReceived.length > 0
          ? Math.round((feedbackReceived.reduce((sum, f) => sum + f.rating, 0) / feedbackReceived.length) * 10) / 10
          : 0;

        overview = {
          ...overview,
          myTotalTasks: myTasks,
          myCompletedTasks: myCompleted,
          myPendingLeaves,
          myAttendanceRate,
          myAvgFeedbackRating: avgRating,
        };
      }

      return {
        overview,
        recentActivity: {
          recentTasks: recentTasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            internName: t.intern?.user?.name || 'N/A',
            createdAt: t.createdAt,
          })),
        },
      };
    } catch (error) {
      logger.error('Analytics dashboard error:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive intern analytics
   */
  async getInternAnalytics(filter: AnalyticsFilter): Promise<InternAnalyticsResult> {
    try {
      const whereClause: any = {};
      if (filter.departmentId) whereClause.departmentId = filter.departmentId;

      const interns = await prisma.intern.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true, email: true } },
          department: { select: { name: true } },
          tasks: { select: { status: true } },
          feedbacks: { select: { rating: true } },
        },
      });

      const totalInterns = interns.length;

      // Status distribution
      const statusDistribution: Record<string, number> = {};
      interns.forEach((intern) => {
        statusDistribution[intern.status] = (statusDistribution[intern.status] || 0) + 1;
      });

      // Avg attendance and score
      const avgAttendance = totalInterns > 0
        ? Math.round((interns.reduce((sum, i) => sum + i.attendance, 0) / totalInterns) * 10) / 10
        : 0;
      const avgScore = totalInterns > 0
        ? Math.round((interns.reduce((sum, i) => sum + i.score, 0) / totalInterns) * 10) / 10
        : 0;

      // Task completion rate
      let totalAllTasks = 0;
      let totalCompletedTasks = 0;
      interns.forEach((intern) => {
        totalAllTasks += intern.tasks.length;
        totalCompletedTasks += intern.tasks.filter((t) => t.status === 'COMPLETED').length;
      });
      const taskCompletionRate = totalAllTasks > 0
        ? Math.round((totalCompletedTasks / totalAllTasks) * 100)
        : 0;

      // Department distribution
      const deptMap = new Map<string, number>();
      interns.forEach((intern) => {
        const name = intern.department?.name || 'Unassigned';
        deptMap.set(name, (deptMap.get(name) || 0) + 1);
      });
      const departmentDistribution = Array.from(deptMap.entries()).map(([department, count]) => ({
        department,
        count,
      }));

      // Top performers (top 10 by score)
      const topPerformers = [...interns]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((intern) => ({
          id: intern.id,
          name: intern.user?.name || 'N/A',
          department: intern.department?.name || 'N/A',
          score: intern.score,
          attendance: intern.attendance,
          taskCompletion: intern.tasks.length > 0
            ? Math.round((intern.tasks.filter((t) => t.status === 'COMPLETED').length / intern.tasks.length) * 100)
            : 0,
        }));

      // Skills distribution
      const skillsDistribution: Record<string, number> = {};
      interns.forEach((intern) => {
        intern.skills.forEach((skill) => {
          skillsDistribution[skill] = (skillsDistribution[skill] || 0) + 1;
        });
      });

      return {
        totalInterns,
        statusDistribution,
        avgAttendance,
        avgScore,
        taskCompletionRate,
        departmentDistribution,
        topPerformers,
        skillsDistribution,
      };
    } catch (error) {
      logger.error('Intern analytics error:', error);
      throw error;
    }
  }

  /**
   * Get mentor performance analytics
   */
  async getMentorAnalytics(filter: AnalyticsFilter): Promise<MentorAnalyticsResult> {
    try {
      const whereClause: any = {};
      if (filter.departmentId) whereClause.departmentId = filter.departmentId;

      const mentors = await prisma.mentor.findMany({
        where: whereClause,
        include: {
          user: { select: { name: true, email: true } },
          department: { select: { name: true } },
          interns: { select: { id: true, status: true, score: true } },
          feedbacks: { select: { rating: true, category: true, createdAt: true } },
          tasks: { select: { status: true } },
        },
      });

      const totalMentors = mentors.length;
      const avgRating = totalMentors > 0
        ? Math.round((mentors.reduce((sum, m) => sum + m.rating, 0) / totalMentors) * 10) / 10
        : 0;

      // Mentor profiles with deep stats
      const mentorProfiles = mentors.map((mentor) => {
        const totalFeedbacks = mentor.feedbacks.length;
        const avgFeedbackRating = totalFeedbacks > 0
          ? Math.round((mentor.feedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks) * 10) / 10
          : 0;

        const totalMentorTasks = mentor.tasks.length;
        const completedMentorTasks = mentor.tasks.filter((t) => t.status === 'COMPLETED').length;
        const reviewPending = mentor.tasks.filter((t) => t.status === 'REVIEW').length;

        return {
          id: mentor.id,
          name: mentor.user?.name || 'N/A',
          department: mentor.department?.name || 'N/A',
          rating: mentor.rating,
          expertise: mentor.expertise,
          assignedInterns: mentor.interns.length,
          activeInterns: mentor.interns.filter((i) => i.status === 'ACTIVE').length,
          totalFeedbacks,
          avgFeedbackRating,
          totalTasks: totalMentorTasks,
          completedTasks: completedMentorTasks,
          pendingReviews: reviewPending,
          taskCompletionRate: totalMentorTasks > 0
            ? Math.round((completedMentorTasks / totalMentorTasks) * 100)
            : 0,
        };
      });

      // Global feedback stats
      const allFeedbacks = mentors.flatMap((m) => m.feedbacks);
      const categoryBreakdown: Record<string, number> = {};
      allFeedbacks.forEach((f) => {
        const cat = f.category || 'General';
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;
      });

      return {
        totalMentors,
        avgRating,
        mentorProfiles,
        feedbackStats: {
          totalFeedbacks: allFeedbacks.length,
          categoryBreakdown,
        },
      };
    } catch (error) {
      logger.error('Mentor analytics error:', error);
      throw error;
    }
  }

  /**
   * Get department-level analytics
   */
  async getDepartmentAnalytics(filter: AnalyticsFilter): Promise<DepartmentAnalyticsResult> {
    try {
      const whereClause: any = {};
      if (filter.departmentId) whereClause.id = filter.departmentId;

      const departments = await prisma.department.findMany({
        where: whereClause,
        include: {
          interns: {
            include: {
              intern: {
                include: {
                  tasks: { select: { status: true } },
                  feedbacks: { select: { rating: true } },
                },
              },
            },
          },
          mentors: true,
          head: {
            select: { name: true },
          },
        },
      });

      const totalDepartments = departments.length;

      const departmentsData = departments.map((dept) => {
        const internCount = dept.interns.length;
        const mentorCount = dept.mentors.length;

        // Avg attendance and score
        const avgAttendance = internCount > 0
          ? Math.round((dept.interns.reduce((sum, i) => sum + (i.intern?.attendance || 0), 0) / internCount) * 10) / 10
          : 0;
        const avgScore = internCount > 0
          ? Math.round((dept.interns.reduce((sum, i) => sum + (i.intern?.score || 0), 0) / internCount) * 10) / 10
          : 0;

        // Task stats
        let totalDeptTasks = 0;
        let completedDeptTasks = 0;
        dept.interns.forEach((u) => {
          if (u.intern) {
            totalDeptTasks += u.intern.tasks.length;
            completedDeptTasks += u.intern.tasks.filter((t) => t.status === 'COMPLETED').length;
          }
        });

        // Feedback stats
        const allFeedbacks = dept.interns.flatMap((u) => u.intern?.feedbacks || []);
        const avgFeedbackRating = allFeedbacks.length > 0
          ? Math.round((allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length) * 10) / 10
          : 0;

        // CGPA spread
        const cgpas = dept.interns.filter((u) => u.intern?.cgpa != null).map((u) => u.intern?.cgpa as number);
        const avgCgpa = cgpas.length > 0
          ? Math.round((cgpas.reduce((sum, c) => sum + c, 0) / cgpas.length) * 100) / 100
          : 0;

        return {
          id: dept.id,
          name: dept.name,
          head: dept.head?.name || 'N/A',
          color: dept.colorTheme || 'indigo',
          internCount,
          mentorCount,
          avgAttendance,
          avgScore,
          avgCgpa,
          totalTasks: totalDeptTasks,
          completedTasks: completedDeptTasks,
          taskCompletionRate: totalDeptTasks > 0
            ? Math.round((completedDeptTasks / totalDeptTasks) * 100)
            : 0,
          avgFeedbackRating,
          mentors: dept.mentors.map((m) => ({
            id: m.id,
            name: m.name,
          })),
        };
      });

      return {
        totalDepartments,
        departments: departmentsData,
      };
    } catch (error) {
      logger.error('Department analytics error:', error);
      throw error;
    }
  }

  /**
   * Get task analytics with status, priority and completion distributions
   */
  async getTaskAnalytics(filter: AnalyticsFilter): Promise<TaskAnalyticsResult> {
    try {
      const whereClause: any = {};
      if (filter.internId) whereClause.internId = filter.internId;
      if (filter.mentorId) whereClause.mentorId = filter.mentorId;

      const dateFilter = buildDateFilter(filter);
      if (dateFilter) whereClause.createdAt = dateFilter;

      const tasks = await prisma.task.findMany({
        where: whereClause,
        include: {
          intern: {
            include: { user: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const totalTasks = tasks.length;

      // Status distribution
      const statusDistribution: Record<string, number> = {
        TODO: 0,
        IN_PROGRESS: 0,
        REVIEW: 0,
        COMPLETED: 0,
      };
      tasks.forEach((t) => {
        statusDistribution[t.status] = (statusDistribution[t.status] || 0) + 1;
      });

      // Priority distribution
      const priorityDistribution: Record<string, number> = {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
      };
      tasks.forEach((t) => {
        priorityDistribution[t.priority] = (priorityDistribution[t.priority] || 0) + 1;
      });

      const completedCount = statusDistribution.COMPLETED || 0;
      const avgCompletionRate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

      // Overdue tasks
      const now = new Date();
      const overdueCount = tasks.filter(
        (t) => t.status !== 'COMPLETED' && new Date(t.dueDate) < now
      ).length;

      // Recent 10
      const recentTasks = tasks.slice(0, 10).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        internName: t.intern?.user?.name || 'N/A',
        createdAt: t.createdAt,
        isOverdue: t.status !== 'COMPLETED' && new Date(t.dueDate) < now,
      }));

      return {
        totalTasks,
        statusDistribution,
        priorityDistribution,
        avgCompletionRate,
        overdueCount,
        recentTasks,
      };
    } catch (error) {
      logger.error('Task analytics error:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
