import prisma from '../config/database';
import { logger } from '../utils/logger';
import goalAIService from './goalAI.service';

class GoalService {

  /**
   * Create a new goal: AI parses the title into tasks, creates the goal + associated tasks in a transaction.
   */
  async createGoal(internId: string, title: string, description?: string) {
    // Get intern details for AI context
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
      include: {
        user: { select: { name: true } },
        mentor: { select: { id: true } },
      }
    });

    if (!intern) {
      throw new Error('Intern not found');
    }

    if (!intern.mentor) {
      throw new Error('Intern must have an assigned mentor to create goals');
    }

    // Check for active goals (max 3 in-progress goals per intern)
    const activeGoalCount = await prisma.goal.count({
      where: { internId, status: 'IN_PROGRESS' }
    });
    if (activeGoalCount >= 3) {
      throw new Error('You can have at most 3 active goals. Complete or delete an existing goal first.');
    }

    // Calculate week range (current week Mon-Sun)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // AI: Parse goal into tasks
    const aiTasks = await goalAIService.parseGoalIntoTasks(
      title,
      intern.user.name,
      intern.skills || []
    );

    // Transaction: create goal + tasks
    const result = await prisma.$transaction(async (tx) => {
      const goal = await tx.goal.create({
        data: {
          internId,
          organizationId: intern.organizationId,
          title,
          description: description || null,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          status: 'IN_PROGRESS',
        }
      });

      const createdTasks = [];
      for (const aiTask of aiTasks) {
        const dueDate = new Date(now);
        dueDate.setDate(now.getDate() + aiTask.daysFromNow);
        dueDate.setHours(23, 59, 59, 0);

        const priorityMap: Record<string, 'HIGH' | 'MEDIUM' | 'LOW'> = {
          'URGENT': 'HIGH',
          'HIGH': 'HIGH',
          'MEDIUM': 'MEDIUM',
          'LOW': 'LOW',
        };
        const mappedPriority = priorityMap[aiTask.priority] || 'MEDIUM';

        const task = await tx.task.create({
          data: {
            title: aiTask.title,
            description: aiTask.description,
            internId,
            mentorId: intern.mentor!.id,
            organizationId: intern.organizationId,
            goalId: goal.id,
            isGoalTask: true,
            priority: mappedPriority,
            status: 'TODO',
            dueDate,
          }
        });
        createdTasks.push(task);
      }

      return { goal, tasks: createdTasks };
    });

    logger.info(`Goal created for intern ${internId}: "${title}" with ${result.tasks.length} AI-generated tasks`);
    return result;
  }

  /**
   * Get all goals for a specific intern with associated tasks.
   */
  async getGoalsForIntern(internId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where: { internId },
        include: {
          tasks: {
            orderBy: { dueDate: 'asc' },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
              isGoalTask: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.goal.count({ where: { internId } })
    ]);

    return {
      goals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  /**
   * Get a single goal by ID with full task details.
   */
  async getGoalById(goalId: string) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        intern: {
          include: { user: { select: { name: true, avatarUrl: true } } }
        },
        tasks: {
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    return goal;
  }

  /**
   * Delete a goal and disassociate its tasks (tasks remain but lose goalId link).
   */
  async deleteGoal(goalId: string, requestingUserId: string) {
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { intern: { include: { user: true } } }
    });

    if (!goal) {
      throw new Error('Goal not found');
    }

    // Only the intern themselves or HR/SUPER_ADMIN can delete
    if (goal.intern.user.id !== requestingUserId) {
      const requestingUser = await prisma.user.findUnique({ where: { id: requestingUserId } });
      if (!requestingUser || !['HR', 'SUPER_ADMIN'].includes(requestingUser.role)) {
        throw new Error('Unauthorized to delete this goal');
      }
    }

    // Disassociate tasks from goal
    await prisma.task.updateMany({
      where: { goalId },
      data: { goalId: null, isGoalTask: false }
    });

    // Delete goal
    await prisma.goal.delete({ where: { id: goalId } });

    logger.info(`Goal ${goalId} deleted by user ${requestingUserId}`);
    return { success: true };
  }

  /**
   * Evaluate all active (IN_PROGRESS) goals that have passed their weekEndDate.
   * Called by Sunday 8 PM cron.
   */
  async evaluateWeeklyGoals() {
    const now = new Date();
    
    // Find all goals that are IN_PROGRESS and whose week has ended
    const activeGoals = await prisma.goal.findMany({
      where: {
        status: 'IN_PROGRESS',
        weekEndDate: { lte: now }
      },
      include: {
        intern: { include: { user: { select: { name: true } } } },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });

    logger.info(`Evaluating ${activeGoals.length} goals that have passed their end date...`);

    let evaluated = 0;
    for (const goal of activeGoals) {
      try {
        const tasksSummary = goal.tasks.map(t => ({
          title: t.title,
          status: t.status,
          isCompleted: t.status === 'COMPLETED'
        }));

        const evaluation = await goalAIService.evaluateGoalProgress(
          goal.title,
          goal.intern.user.name,
          tasksSummary
        );

        await prisma.goal.update({
          where: { id: goal.id },
          data: {
            status: evaluation.status,
            completionRate: evaluation.completionRate,
            aiEvaluation: evaluation.evaluation,
          }
        });

        // Create in-app notification for the intern
        const internUser = await prisma.user.findFirst({
          where: { intern: { id: goal.internId } }
        });

        if (internUser) {
          await prisma.notification.create({
            data: {
              userId: internUser.id,
              organizationId: goal.organizationId,
              title: `Weekly Goal Evaluated: "${goal.title}"`,
              message: evaluation.evaluation,
              type: 'SYSTEM',
            }
          });
        }

        evaluated++;
      } catch (error: any) {
        logger.error(`Failed to evaluate goal ${goal.id}: ${error.message}`);
      }
    }

    logger.info(`Successfully evaluated ${evaluated}/${activeGoals.length} goals.`);
    return { total: activeGoals.length, evaluated };
  }

  /**
   * Get goal statistics for an intern.
   */
  async getGoalStats(internId: string) {
    const [total, achieved, partial, notAchieved, inProgress] = await Promise.all([
      prisma.goal.count({ where: { internId } }),
      prisma.goal.count({ where: { internId, status: 'ACHIEVED' } }),
      prisma.goal.count({ where: { internId, status: 'PARTIALLY_ACHIEVED' } }),
      prisma.goal.count({ where: { internId, status: 'NOT_ACHIEVED' } }),
      prisma.goal.count({ where: { internId, status: 'IN_PROGRESS' } }),
    ]);

    const achievementRate = total > 0 ? Math.round((achieved / total) * 100) : 0;

    return { total, achieved, partial, notAchieved, inProgress, achievementRate };
  }
}

export default new GoalService();
