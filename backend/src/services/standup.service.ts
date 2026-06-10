import prisma from '../config/database';
import notificationService from './notification.service';
import { logger } from '../utils/logger';

/**
 * Get the date portion at midnight UTC
 */
export const getTodayDateOnly = (): Date => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
};

/**
 * Get or create standup settings for an organization
 */
export const getStandupSettings = async (organizationId: string) => {
  let settings = await prisma.standupSettings.findUnique({
    where: { organizationId },
  });

  if (!settings) {
    settings = await prisma.standupSettings.create({
      data: {
        organizationId,
        isEnabled: true,
        promptTime: '09:00',
        cutoffTime: '11:30',
        timezone: 'UTC',
        missedAlertThreshold: 3,
        weekendsEnabled: false,
      },
    });
  }

  return settings;
};

/**
 * Update standup settings for an organization
 */
export const updateStandupSettings = async (organizationId: string, data: {
  isEnabled?: boolean;
  promptTime?: string;
  cutoffTime?: string;
  timezone?: string;
  missedAlertThreshold?: number;
  weekendsEnabled?: boolean;
}) => {
  return prisma.standupSettings.upsert({
    where: { organizationId },
    update: data,
    create: {
      organizationId,
      isEnabled: data.isEnabled ?? true,
      promptTime: data.promptTime ?? '09:00',
      cutoffTime: data.cutoffTime ?? '11:30',
      timezone: data.timezone ?? 'UTC',
      missedAlertThreshold: data.missedAlertThreshold ?? 3,
      weekendsEnabled: data.weekendsEnabled ?? false,
    },
  });
};

/**
 * Get today's daily standup record for an intern (returns null or record)
 */
export const getTodayStandup = async (internId: string) => {
  const today = getTodayDateOnly();
  let standup = await prisma.dailyStandup.findUnique({
    where: {
      internId_date: {
        internId,
        date: today,
      },
    },
  });

  // If no record initialized yet, try to find an existing unsubmitted one or return null
  return standup;
};

/**
 * Submit daily standup report
 */
export const submitStandup = async (
  internId: string,
  organizationId: string,
  data: {
    yesterday: string;
    today: string;
    blockers?: string;
    mood: 'GREAT' | 'GOOD' | 'OKAY' | 'STRUGGLING';
  }
) => {
  const today = getTodayDateOnly();
  const settings = await getStandupSettings(organizationId);

  // Check if current time is after cutoff time
  const now = new Date();
  const [cutoffHours, cutoffMinutes] = settings.cutoffTime.split(':').map(Number);
  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffHours, cutoffMinutes, 0, 0);
  const isLate = now > cutoffDate;

  // Upsert daily standup
  const standup = await prisma.dailyStandup.upsert({
    where: {
      internId_date: {
        internId,
        date: today,
      },
    },
    update: {
      yesterday: data.yesterday,
      today: data.today,
      blockers: data.blockers || null,
      mood: data.mood,
      submittedAt: new Date(),
      isLate,
    },
    create: {
      internId,
      organizationId,
      date: today,
      yesterday: data.yesterday,
      today: data.today,
      blockers: data.blockers || null,
      mood: data.mood,
      submittedAt: new Date(),
      isLate,
    },
  });

  // Award 15 XP for submitting standup
  try {
    const { awardXP } = await import('./gamification.service');
    await awardXP(
      internId,
      15, // XP_RULES.DAILY_STANDUP
      'STANDUP',
      'Daily standup submitted',
      standup.id
    );
  } catch (err) {
    logger.error(`Failed to award standup XP for intern ${internId}:`, err);
  }

  return standup;
};

/**
 * Pre-populate daily standup records for all active interns at 9:00 AM
 */
export const createDailyRecords = async () => {
  try {
    const today = getTodayDateOnly();
    const activeInterns = await prisma.intern.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, organizationId: true, userId: true },
    });

    let count = 0;
    for (const intern of activeInterns) {
      if (!intern.organizationId) continue;

      const settings = await getStandupSettings(intern.organizationId);
      if (!settings.isEnabled) continue;

      // Check if already exists
      const existing = await prisma.dailyStandup.findUnique({
        where: {
          internId_date: {
            internId: intern.id,
            date: today,
          },
        },
      });

      if (!existing) {
        await prisma.dailyStandup.create({
          data: {
            internId: intern.id,
            organizationId: intern.organizationId,
            date: today,
            yesterday: '',
            today: '',
            mood: 'OKAY',
            submittedAt: null,
            isLate: false,
          },
        });

        // Trigger in-app notification prompt
        await notificationService.createNotification(
          intern.userId,
          '⏰ Daily Standup Due',
          'Good morning! Please submit your daily standup updates detailing yesterday, today, and blockers.',
          'STANDUP'
        );

        count++;
      }
    }

    logger.info(`Initialized daily standup records for ${count} active interns.`);
    return count;
  } catch (err) {
    logger.error('Failed to create daily standup records:', err);
    throw err;
  }
};

/**
 * Check missed standups at cutoff time (11:30 AM) and auto-alert mentors if 3 missed in a row
 */
export const checkMissedStandups = async () => {
  try {
    const today = getTodayDateOnly();
    const unsubmittedStandups = await prisma.dailyStandup.findMany({
      where: {
        date: today,
        submittedAt: null,
      },
      include: {
        intern: {
          include: {
            user: { select: { name: true } },
            mentor: { include: { user: { select: { id: true } } } },
          },
        },
      },
    });

    for (const record of unsubmittedStandups) {
      // Send a nudge notification to the intern first
      await notificationService.createNotification(
        record.intern.userId,
        '⚠️ Standup Overdue',
        'You have missed today\'s daily standup submission cutoff window. Please fill it out as soon as possible.',
        'STANDUP'
      );

      // Check if they missed 3 consecutive standups
      const lastStandups = await prisma.dailyStandup.findMany({
        where: { internId: record.internId },
        orderBy: { date: 'desc' },
        take: 3,
      });

      const hasMissedThree = lastStandups.length >= 3 && lastStandups.every((s) => s.submittedAt === null);

      if (hasMissedThree && record.intern.mentor?.user?.id) {
        // Send critical alert to the supervisor/mentor
        await notificationService.createNotification(
          record.intern.mentor.user.id,
          `🚨 Missed Standups Alert: ${record.intern.user.name}`,
          `${record.intern.user.name} has missed ${lastStandups.length} consecutive standups. Please follow up.`,
          'STANDUP',
          { internId: record.internId }
        );
      }
    }

    logger.info(`Completed daily missed standups check for ${unsubmittedStandups.length} records.`);
  } catch (err) {
    logger.error('Failed to check missed standups:', err);
    throw err;
  }
};

/**
 * Fetch past standups for an intern
 */
export const getStandupHistory = async (internId: string, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const items = await prisma.dailyStandup.findMany({
    where: {
      internId,
      submittedAt: { not: null },
    },
    orderBy: { date: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.dailyStandup.count({
    where: {
      internId,
      submittedAt: { not: null },
    },
  });

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Fetch team standups for a given date in an organization
 */
export const getTeamStandups = async (organizationId: string, date: Date) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return prisma.dailyStandup.findMany({
    where: {
      organizationId,
      date: targetDate,
      submittedAt: { not: null },
    },
    include: {
      intern: {
        include: {
          user: {
            select: {
              name: true,
              email: true,
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
    orderBy: { submittedAt: 'desc' },
  });
};
