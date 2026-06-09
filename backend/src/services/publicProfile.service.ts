import prisma from '../config/database';
import { config } from '../config/env';

// ─── Types ─────────────────────────────────────────────────────────

export interface PublicProfileResponse {
  name: string;
  avatarUrl: string | null;
  departmentName: string;
  status: string;
  username: string;
  customBio: string | null;
  // Conditional fields (null when hidden by privacy settings)
  skills: string[] | null;
  tasksCompleted: number | null;
  totalTasks: number | null;
  feedbackScore: number | null;
  feedbackCount: number | null;
  performanceGrade: string | null;
  attendance: number | null;
  mentorName: string | null;
  college: string | null;
  joinedDate: string | null;
}

// ─── Username Generation ───────────────────────────────────────────

/**
 * Generate a URL-safe username from a full name.
 * If the slug is taken, append the last 4 chars of the user's ID.
 */
export const generateUsername = async (
  fullName: string,
  userId: string
): Promise<string> => {
  // Convert "Rahul Sharma" → "rahul-sharma"
  const base = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '');        // trim leading/trailing hyphens

  const slug = base || 'intern';

  // Check if base slug is available
  const existing = await prisma.user.findUnique({
    where: { username: slug },
  });

  if (!existing) {
    return slug;
  }

  // Append last 4 chars of userId
  const suffix = userId.slice(-4);
  const slugWithSuffix = `${slug}-${suffix}`;

  // Check if suffix variant is also taken (very unlikely, but be safe)
  const existingWithSuffix = await prisma.user.findUnique({
    where: { username: slugWithSuffix },
  });

  if (!existingWithSuffix) {
    return slugWithSuffix;
  }

  // Final fallback: append full UUID segment
  return `${slug}-${userId.slice(-8)}`;
};

/**
 * Ensure a user has a username. If not, generate and save one.
 * Returns the username.
 */
export const ensureUsername = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, name: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.username) {
    return user.username;
  }

  const username = await generateUsername(user.name, userId);

  await prisma.user.update({
    where: { id: userId },
    data: { username },
  });

  return username;
};

// ─── Public Profile Retrieval ──────────────────────────────────────

/**
 * Compute a performance grade string from a numeric score.
 */
const getPerformanceGrade = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'Not Graded';
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Average';
  return 'Needs Improvement';
};

/**
 * Fetch a public profile by username.
 * Returns null if the profile doesn't exist or is set to private.
 */
export const getPublicProfile = async (
  username: string
): Promise<PublicProfileResponse | null> => {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      publicProfileSettings: true,
      intern: {
        include: {
          department: {
            select: { name: true },
          },
          mentor: {
            include: {
              user: {
                select: { name: true },
              },
            },
          },
          tasks: {
            select: { status: true },
          },
          feedbacks: {
            select: { rating: true },
          },
        },
      },
    },
  });

  if (!user || !user.intern) {
    return null;
  }

  // Check privacy master toggle
  const settings = user.publicProfileSettings;
  if (settings && !settings.isPublic) {
    return null;
  }

  const intern = user.intern;

  // Always-public fields
  const profile: PublicProfileResponse = {
    name: user.name,
    avatarUrl: user.avatarUrl,
    departmentName: intern.department?.name || 'Unassigned',
    status: intern.status,
    username: user.username!,
    customBio: settings?.customBio || null,
    // Conditional fields — default to null (hidden)
    skills: null,
    tasksCompleted: null,
    totalTasks: null,
    feedbackScore: null,
    feedbackCount: null,
    performanceGrade: null,
    attendance: null,
    mentorName: null,
    college: null,
    joinedDate: intern.joinedDate?.toISOString() || null,
  };

  // If no settings record exists, show everything by default
  const showAll = !settings;

  // Skills
  if (showAll || settings?.showSkills) {
    profile.skills = intern.skills || [];
  }

  // Tasks
  if (showAll || settings?.showTasks) {
    const completedTasks = intern.tasks.filter(
      (t) => t.status === 'COMPLETED'
    ).length;
    profile.tasksCompleted = completedTasks;
    profile.totalTasks = intern.tasks.length;
  }

  // Feedback Score
  if (showAll || settings?.showFeedbackScore) {
    const feedbacks = intern.feedbacks || [];
    if (feedbacks.length > 0) {
      const avg =
        feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
      profile.feedbackScore = Math.round(avg * 10) / 10; // 1 decimal
      profile.feedbackCount = feedbacks.length;
    } else {
      profile.feedbackScore = 0;
      profile.feedbackCount = 0;
    }
  }

  // Performance Grade
  if (showAll || settings?.showPerformanceGrade) {
    profile.performanceGrade = getPerformanceGrade(intern.score);
  }

  // Attendance
  if (showAll || settings?.showAttendance) {
    profile.attendance = intern.attendance;
  }

  // Mentor Name
  if (showAll || settings?.showMentorName) {
    profile.mentorName = intern.mentor?.user?.name || null;
  }

  // College
  if (showAll || settings?.showCollege) {
    profile.college = intern.college || null;
  }

  return profile;
};

// ─── Privacy Settings CRUD ─────────────────────────────────────────

/**
 * Get (or create default) public profile settings for a user.
 */
export const getPublicSettings = async (userId: string) => {
  let settings = await prisma.publicProfileSettings.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.publicProfileSettings.create({
      data: { userId },
    });
  }

  return settings;
};

/**
 * Update public profile settings for a user.
 */
export const updatePublicSettings = async (
  userId: string,
  data: {
    isPublic?: boolean;
    showSkills?: boolean;
    showTasks?: boolean;
    showFeedbackScore?: boolean;
    showPerformanceGrade?: boolean;
    showAttendance?: boolean;
    showMentorName?: boolean;
    showCollege?: boolean;
    customBio?: string | null;
  }
) => {
  // Ensure settings record exists
  await getPublicSettings(userId);

  const settings = await prisma.publicProfileSettings.update({
    where: { userId },
    data,
  });

  return settings;
};

/**
 * Get the full public profile URL for a user.
 */
export const getMyPublicUrl = async (userId: string): Promise<string> => {
  const username = await ensureUsername(userId);
  const frontendUrl = config.frontend.url.replace(/\/+$/, '');
  return `${frontendUrl}/profile/${username}`;
};
