import prisma from '../config/database';
import { logger } from '../utils/logger';

export class CohortAnalyticsService {
  /**
   * Get all batches for selection
   */
  async getBatches(organizationId: string) {
    return prisma.internshipBatch.findMany({
      where: { organizationId },
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { interns: true },
        },
      },
    });
  }

  /**
   * Create a new internship batch
   */
  async createBatch(data: {
    name: string;
    startDate: Date;
    endDate: Date;
    description?: string;
    organizationId: string;
  }) {
    return prisma.internshipBatch.create({
      data,
    });
  }

  /**
   * Add interns to a batch
   */
  async addInternsToBatch(batchId: string, internIds: string[]) {
    return prisma.$transaction(
      internIds.map(internId =>
        prisma.intern.update({
          where: { id: internId },
          data: { batchId },
        })
      )
    );
  }

  /**
   * Get comparison metrics for selected batches
   */
  async compareBatches(batchIds: string[], organizationId: string) {
    logger.info(`Comparing cohorts/batches: ${batchIds.join(', ')}`);

    try {
      const batches = await prisma.internshipBatch.findMany({
        where: {
          id: { in: batchIds },
          organizationId,
        },
        include: {
          interns: {
            include: {
              tasks: true,
              attendances: true,
              user: {
                select: { name: true, email: true },
              },
            },
          },
        },
      });

      const metrics = batches.map(batch => {
        const totalInterns = batch.interns.length;
        if (totalInterns === 0) {
          return {
            batchId: batch.id,
            name: batch.name,
            startDate: batch.startDate,
            endDate: batch.endDate,
            totalInterns: 0,
            avgPerformanceScore: 0,
            avgAttendanceRate: 0,
            taskCompletionRate: 0,
            overdueTaskRate: 0,
            atRiskCount: 0,
            departmentBreakdown: {},
          };
        }

        let sumScore = 0;
        let sumAttendance = 0;
        let totalTasks = 0;
        let completedTasks = 0;
        let overdueTasks = 0;
        let atRiskCount = 0;
        const departmentCounts: Record<string, number> = {};

        batch.interns.forEach(intern => {
          sumScore += intern.score || 0;
          sumAttendance += intern.attendance || 0;

          // Department breakdown
          const deptId = intern.departmentId;
          departmentCounts[deptId] = (departmentCounts[deptId] || 0) + 1;

          // Task details
          const tasks = intern.tasks;
          totalTasks += tasks.length;
          tasks.forEach(t => {
            if (t.status === 'COMPLETED') {
              completedTasks++;
            }
            if (t.status !== 'COMPLETED' && new Date(t.dueDate) < new Date()) {
              overdueTasks++;
            }
          });

          // Check if at risk (low attendance or low task performance)
          if (intern.attendance < 75 || intern.score < 50) {
            atRiskCount++;
          }
        });

        const avgPerformanceScore = sumScore / totalInterns;
        const avgAttendanceRate = sumAttendance / totalInterns;
        const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
        const overdueTaskRate = totalTasks > 0 ? (overdueTasks / totalTasks) * 100 : 0;

        return {
          batchId: batch.id,
          name: batch.name,
          startDate: batch.startDate,
          endDate: batch.endDate,
          totalInterns,
          avgPerformanceScore: Math.round(avgPerformanceScore * 10) / 10,
          avgAttendanceRate: Math.round(avgAttendanceRate * 10) / 10,
          taskCompletionRate: Math.round(taskCompletionRate * 10) / 10,
          overdueTaskRate: Math.round(overdueTaskRate * 10) / 10,
          atRiskCount,
          departmentBreakdown: departmentCounts,
        };
      });

      return metrics;
    } catch (err: any) {
      logger.error(`Failed to compare cohorts: ${err.message}`);
      throw err;
    }
  }
}

export default new CohortAnalyticsService();
