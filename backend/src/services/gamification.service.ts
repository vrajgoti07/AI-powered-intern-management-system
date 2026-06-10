import prisma from '../config/database';
import redis from '../config/redis';
import notificationService from './notification.service';
import { logger } from '../utils/logger';

// XP Awarding Rules config values
export const XP_RULES = {
  TASK_COMPLETED: 100,
  PERFECT_TASK_SCORE: 50,
  DAILY_CHECKIN: 20,
  LATE_CHECKIN: 10,
  FEEDBACK_RECEIVED: 30,
  DAILY_STANDUP: 15,
  ONBOARDING_COMPLETE: 150,
  ABSENT_PENALTY: -15,
};

/**
 * Award XP to an intern, record transaction, update levels, sync leaderboard and check badge unlocks.
 */
export const awardXP = async (
  internId: string,
  points: number,
  sourceType: 'TASK' | 'ATTENDANCE' | 'FEEDBACK' | 'STANDUP' | 'ONBOARDING' | 'BONUS' | 'PENALTY',
  reason: string,
  sourceId?: string
) => {
  try {
    // 1. Fetch Intern details
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
      select: { userId: true, organizationId: true },
    });

    if (!intern) {
      throw new Error(`Intern with ID ${internId} not found.`);
    }

    const orgId = intern.organizationId;

    // 2. Record the XP transaction
    await prisma.xPTransaction.create({
      data: {
        internId,
        organizationId: orgId,
        points,
        reason,
        sourceType,
        sourceId: sourceId || null,
      },
    });

    // 3. Upsert current InternPoints state
    const currentPoints = await prisma.internPoints.findUnique({
      where: { internId },
    });

    let newTotalXP = points;
    let newLevel = 1;

    if (currentPoints) {
      newTotalXP = Math.max(0, currentPoints.totalXP + points); // Prevent negative total XP
      newLevel = Math.floor(newTotalXP / 500) + 1;

      await prisma.internPoints.update({
        where: { id: currentPoints.id },
        data: {
          totalXP: newTotalXP,
          level: newLevel,
          currentWeekXP: Math.max(0, currentPoints.currentWeekXP + points),
        },
      });
    } else {
      newLevel = Math.floor(Math.max(0, points) / 500) + 1;
      await prisma.internPoints.create({
        data: {
          internId,
          organizationId: orgId,
          totalXP: Math.max(0, points),
          level: newLevel,
          currentWeekXP: Math.max(0, points),
          currentStreak: 0,
          longestStreak: 0,
        },
      });
    }

    // 4. Send notification on level up
    if (currentPoints && newLevel > currentPoints.level) {
      await notificationService.createNotification(
        intern.userId,
        '🎉 Level Up!',
        `Congratulations! You have reached Level ${newLevel}! Keep up the great work.`,
        'GAMIFICATION',
        { level: newLevel }
      );
    }

    // 5. Sync total XP to Redis leaderboard sorted set
    if (redis.status === 'ready' && orgId) {
      const redisKey = `organization:${orgId}:leaderboard`;
      await redis.zadd(redisKey, newTotalXP, internId);
    }

    // 6. Check and award any new achievement badges
    const unlockedBadges = await checkAndAwardBadges(internId);

    return {
      levelUp: currentPoints ? newLevel > currentPoints.level : false,
      newLevel,
      totalXP: newTotalXP,
      unlockedBadges,
    };
  } catch (error) {
    logger.error(`Failed to award XP to intern ${internId}:`, error);
    throw error;
  }
};

/**
 * Recalculate and update the consecutive check-in streak count for an intern.
 */
export const updateAttendanceStreak = async (internId: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Fetch attendance from yesterday
    const yesterdayAttendance = await prisma.attendance.findFirst({
      where: {
        internId,
        date: yesterday,
        status: { in: ['PRESENT', 'LATE'] },
      },
    });

    const currentPoints = await prisma.internPoints.findUnique({
      where: { internId },
    });

    if (!currentPoints) return;

    let newStreak = 1;
    if (yesterdayAttendance) {
      newStreak = currentPoints.currentStreak + 1;
    }

    const newLongestStreak = Math.max(currentPoints.longestStreak, newStreak);

    await prisma.internPoints.update({
      where: { id: currentPoints.id },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
      },
    });

    // Check badges since attendance streaks might unlock Dedication or Attendance Streak
    await checkAndAwardBadges(internId);
  } catch (error) {
    logger.error(`Failed to update attendance streak for intern ${internId}:`, error);
  }
};

/**
 * Evaluate all locked badge templates for an intern and award unlocked achievements.
 */
export const checkAndAwardBadges = async (internId: string): Promise<string[]> => {
  const newlyUnlocked: string[] = [];

  try {
    const intern = await prisma.intern.findUnique({
      where: { id: internId },
      include: {
        user: { select: { id: true } },
        points: true,
      },
    });

    if (!intern) return [];

    // Fetch all badges and already earned badges
    const allBadges = await prisma.badge.findMany();
    const earnedBadges = await prisma.internBadge.findMany({
      where: { internId },
      select: { badgeId: true },
    });

    const earnedBadgeIds = new Set(earnedBadges.map((eb) => eb.badgeId));

    for (const badge of allBadges) {
      if (earnedBadgeIds.has(badge.id)) {
        continue; // Already earned
      }

      const req = badge.requirement as any;
      let isEligible = false;

      switch (req.type) {
        case 'task_count': {
          const completedCount = await prisma.task.count({
            where: { internId, status: 'COMPLETED' },
          });
          if (completedCount >= req.threshold) {
            isEligible = true;
          }
          break;
        }

        case 'speed_completion': {
          const fastTasks = await prisma.task.findMany({
            where: {
              internId,
              status: 'COMPLETED',
              submittedAt: { not: null },
            },
          });

          isEligible = fastTasks.some((task) => {
            if (!task.submittedAt) return false;
            const diffMs = task.submittedAt.getTime() - task.createdAt.getTime();
            const maxMs = req.maxHours * 60 * 60 * 1000;
            return diffMs <= maxMs;
          });
          break;
        }

        case 'perfect_task_score': {
          const perfectTask = await prisma.task.findFirst({
            where: {
              internId,
              status: 'COMPLETED',
              submissionNotes: { contains: '10/10' }, // Simple rating indicator fallback
            },
          });
          if (perfectTask) {
            isEligible = true;
          }
          break;
        }

        case 'early_checkin': {
          const checkins = await prisma.attendance.findMany({
            where: {
              internId,
              checkIn: { not: null },
            },
          });

          isEligible = checkins.some((att) => {
            if (!att.checkIn) return false;
            const checkinTime = new Date(att.checkIn);
            const limitHours = parseInt(req.beforeTime.split(':')[0], 10);
            const limitMins = parseInt(req.beforeTime.split(':')[1], 10);

            const hours = checkinTime.getHours();
            const mins = checkinTime.getMinutes();
            return hours < limitHours || (hours === limitHours && mins <= limitMins);
          });
          break;
        }

        case 'attendance_streak': {
          const streak = intern.points?.longestStreak || 0;
          if (streak >= req.threshold) {
            isEligible = true;
          }
          break;
        }

        case 'standup_count': {
          // Dynamic query in case standup is added in future phase
          let count = 0;
          try {
            count = await (prisma as any).dailyStandup.count({
              where: { internId },
            });
          } catch {
            // Table doesn't exist yet
          }
          if (count >= req.threshold) {
            isEligible = true;
          }
          break;
        }

        case 'chat_messages_count': {
          const count = await prisma.message.count({
            where: { senderId: intern.userId },
          });
          if (count >= req.threshold) {
            isEligible = true;
          }
          break;
        }

        case 'feedback_score': {
          const feedback = await prisma.feedback.findFirst({
            where: {
              internId,
              rating: { gte: req.minScore },
            },
          });
          if (feedback) {
            isEligible = true;
          }
          break;
        }

        case 'onboarding_approved': {
          const onboarding = await prisma.onboardingProgress.findUnique({
            where: { internId },
          });
          if (onboarding && onboarding.verificationStatus === 'APPROVED') {
            isEligible = true;
          }
          break;
        }

        case 'level_reached': {
          const level = intern.points?.level || 1;
          if (level >= req.level) {
            isEligible = true;
          }
          break;
        }

        default:
          break;
      }

      if (isEligible) {
        // Unlock badge in DB
        await prisma.internBadge.create({
          data: {
            internId,
            badgeId: badge.id,
            organizationId: intern.organizationId,
          },
        });

        // Send alert/notification to the user
        await notificationService.createNotification(
          intern.userId,
          `🏆 Achievement Unlocked!`,
          `You unlocked the badge: ${badge.iconEmoji} ${badge.name}! "${badge.description}"`,
          'GAMIFICATION',
          { badgeId: badge.id, icon: badge.iconEmoji }
        );

        newlyUnlocked.push(badge.name);
      }
    }
  } catch (err) {
    logger.error(`Failed to verify badges for intern ${internId}:`, err);
  }

  return newlyUnlocked;
};

/**
 * Retrieve the leaderboard (Top 10) for an organization.
 */
export const getLeaderboard = async (organizationId: string) => {
  try {
    // 1. Fetch from Redis if connected
    if (redis.status === 'ready') {
      const redisKey = `organization:${organizationId}:leaderboard`;
      const rawLeaders = await redis.zrevrange(redisKey, 0, 9, 'WITHSCORES');

      if (rawLeaders.length > 0) {
        const leaders = [];
        for (let i = 0; i < rawLeaders.length; i += 2) {
          const internId = rawLeaders[i];
          const totalXP = parseInt(rawLeaders[i + 1], 10);

          const internInfo = await prisma.intern.findUnique({
            where: { id: internId },
            include: {
              user: {
                select: {
                  name: true,
                  avatarUrl: true,
                  role: true,
                },
              },
              department: {
                select: {
                  name: true,
                },
              },
              points: {
                select: {
                  level: true,
                  currentStreak: true,
                },
              },
            },
          });

          if (internInfo) {
            leaders.push({
              internId,
              name: internInfo.user.name,
              avatarUrl: internInfo.user.avatarUrl,
              department: internInfo.department.name,
              level: internInfo.points?.level || 1,
              streak: internInfo.points?.currentStreak || 0,
              totalXP,
              rank: Math.floor(i / 2) + 1,
            });
          }
        }
        return leaders;
      }
    }

    // 2. Fallback to direct DB query if Redis is not configured or offline
    const dbLeaders = await prisma.internPoints.findMany({
      where: { organizationId },
      orderBy: { totalXP: 'desc' },
      take: 10,
      include: {
        intern: {
          include: {
            user: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return dbLeaders.map((record, index) => ({
      internId: record.internId,
      name: record.intern.user.name,
      avatarUrl: record.intern.user.avatarUrl,
      department: record.intern.department.name,
      level: record.level,
      streak: record.currentStreak,
      totalXP: record.totalXP,
      rank: index + 1,
    }));
  } catch (error) {
    logger.error(`Failed to fetch leaderboard for organization ${organizationId}:`, error);
    throw error;
  }
};

/**
 * Retrieve current statistics (XP, level, transactions, badges) for a single user/intern
 */
export const getUserStats = async (userId: string) => {
  try {
    const intern = await prisma.intern.findUnique({
      where: { userId },
      select: { id: true, organizationId: true },
    });

    if (!intern) {
      throw new Error('Intern profile not found.');
    }

    const points = await prisma.internPoints.findUnique({
      where: { internId: intern.id },
    });

    const recentTransactions = await prisma.xPTransaction.findMany({
      where: { internId: intern.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const earnedBadges = await prisma.internBadge.findMany({
      where: { internId: intern.id },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    return {
      level: points?.level || 1,
      totalXP: points?.totalXP || 0,
      currentWeekXP: points?.currentWeekXP || 0,
      currentStreak: points?.currentStreak || 0,
      longestStreak: points?.longestStreak || 0,
      recentTransactions,
      badges: earnedBadges.map((eb) => ({
        id: eb.badge.id,
        name: eb.badge.name,
        description: eb.badge.description,
        iconEmoji: eb.badge.iconEmoji,
        category: eb.badge.category,
        earnedAt: eb.earnedAt,
      })),
    };
  } catch (error) {
    logger.error(`Failed to fetch user stats for userId ${userId}:`, error);
    throw error;
  }
};
