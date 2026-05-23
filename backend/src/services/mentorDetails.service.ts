import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { getSocketIO } from '../socket/socket';
import notificationService from './notification.service';
import cloudinary from '../config/cloudinary';
import { logger } from '../utils/logger';

// ─────────────────────────────────────────────
//  MENTOR DETAILS - Full Profile
// ─────────────────────────────────────────────

/**
 * Get comprehensive mentor details with all relations
 */
export const getFullMentorDetails = async (mentorId: string) => {
  // Always compute and store latest analytics first to ensure the deep-included analytics record is fresh
  try {
    await computeAndStoreAnalytics(mentorId);
  } catch (err) {
    logger.error(`Failed to pre-compute analytics for mentor ${mentorId}:`, err);
  }

  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
        },
      },
      department: true,
      interns: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
          department: true,
        },
      },
      tasks: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          intern: {
            include: {
              user: {
                select: { name: true, avatarUrl: true },
              },
            },
          },
        },
      },
      feedbacks: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      analytics: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!mentor) {
    throw new AppError('Mentor not found', 404);
  }

  return mentor;
};

// ─────────────────────────────────────────────
//  UPDATE MENTOR PROFILE
// ─────────────────────────────────────────────

/**
 * Update mentor profile - both Mentor and User records in a transaction
 */
export const updateMentorProfile = async (
  mentorId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string | null;
    departmentId?: string;
    designation?: string | null;
    experience?: number;
    skills?: string[];
    expertise?: string[];
    bio?: string | null;
    mentorCapacity?: number;
    mentorStatus?: string;
    rating?: number;
  }
) => {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: { user: true },
  });

  if (!mentor) {
    throw new AppError('Mentor not found', 404);
  }

  if (data.departmentId) {
    const dept = await prisma.department.findUnique({ where: { id: data.departmentId } });
    if (!dept) throw new AppError('Department not found', 404);
  }

  // Separate user fields from mentor fields
  const { name, email, ...mentorFields } = data;
  const userUpdate: any = {};
  if (name) userUpdate.name = name;
  if (email) userUpdate.email = email;

  const result = await prisma.$transaction(async (tx) => {
    // Update user record if name or email changed
    if (Object.keys(userUpdate).length > 0) {
      await tx.user.update({
        where: { id: mentor.userId },
        data: userUpdate,
      });
    }

    // Update mentor record
    const updated = await tx.mentor.update({
      where: { id: mentorId },
      data: mentorFields,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            isActive: true,
            createdAt: true,
          },
        },
        department: true,
        interns: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });

    // Log activity
    await tx.mentorActivity.create({
      data: {
        mentorId,
        activityType: 'PROFILE_UPDATED',
        description: `Profile updated by HR`,
        metadata: { changedFields: Object.keys(data) },
      },
    });

    return updated;
  });

  // Emit socket event
  getSocketIO()?.to(`mentor:${mentorId}`).emit('mentor_updated', result);

  // Notify mentor
  try {
    await notificationService.createNotification(
      mentor.userId,
      'Profile Updated',
      'Your mentor profile has been updated by HR.',
      'SYSTEM'
    );
  } catch (err) {
    logger.error('Failed to send profile update notification:', err);
  }

  return result;
};

// ─────────────────────────────────────────────
//  MENTOR ANALYTICS
// ─────────────────────────────────────────────

/**
 * Get analytics for a mentor (latest computed record)
 */
export const getMentorAnalytics = async (mentorId: string) => {
  const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
  if (!mentor) throw new AppError('Mentor not found', 404);

  // Always compute and store the latest analytics on fetch to ensure 100% accurate data
  const analytics = await computeAndStoreAnalytics(mentorId);
  return analytics;
};

/**
 * Recompute analytics from source data and store
 */
export async function computeAndStoreAnalytics(mentorId: string) {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: {
      interns: {
        include: {
          tasks: true,
          leaves: true,
        },
      },
      tasks: true,
      feedbacks: true,
    },
  });

  if (!mentor) throw new AppError('Mentor not found', 404);

  // Compute real metrics
  const totalInterns = mentor.interns.length;
  const completedInternships = mentor.interns.filter(i => i.status === 'COMPLETED').length;
  const avgRating =
    mentor.feedbacks.length > 0
      ? mentor.feedbacks.reduce((sum, f) => sum + f.rating, 0) / mentor.feedbacks.length
      : 0;

  const taskReviews = mentor.tasks.filter(t => t.status === 'COMPLETED' || t.status === 'REVIEW').length;

  // Count leave approvals handled (leaves where approvedBy contains mentor user info)
  let leaveApprovalsHandled = 0;
  for (const intern of mentor.interns) {
    const approvedLeaves = intern.leaves.filter(l => l.status === 'APPROVED');
    leaveApprovalsHandled += approvedLeaves.length;
  }

  // Attendance reviews - count of interns with attendance data reviewed
  const attendanceReviews = mentor.interns.filter(i => i.attendance > 0).length;

  // AI Mentor Score - weighted formula (fallback heuristic)
  const completionRate = totalInterns > 0 ? completedInternships / totalInterns : 0;
  const taskCompletionRate = mentor.tasks.length > 0
    ? mentor.tasks.filter(t => t.status === 'COMPLETED').length / mentor.tasks.length
    : 0;
  const normalizedRating = avgRating / 5;

  const aiMentorScore = Math.round(
    (normalizedRating * 30 + taskCompletionRate * 100 * 35 + completionRate * 100 * 25 + (attendanceReviews > 0 ? 10 : 0)) / 10
  ) / 10;

  // Performance trend - compute monthly task completion for last 6 months
  const performanceTrend: Array<{ month: string; score: number; tasks: number }> = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const monthLabel = monthStart.toLocaleString('default', { month: 'short', year: '2-digit' });

    const monthTasks = mentor.tasks.filter(t => {
      const created = new Date(t.createdAt);
      return created >= monthStart && created <= monthEnd;
    });

    const completed = monthTasks.filter(t => t.status === 'COMPLETED').length;
    const score = monthTasks.length > 0 ? Math.round((completed / monthTasks.length) * 100) : 0;

    performanceTrend.push({ month: monthLabel, score, tasks: monthTasks.length });
  }

  // Upsert analytics record
  const existing = await prisma.mentorAnalytics.findFirst({
    where: { mentorId },
  });

  let analytics;
  if (existing) {
    analytics = await prisma.mentorAnalytics.update({
      where: { id: existing.id },
      data: {
        totalInterns,
        completedInternships,
        avgRating: Math.round(avgRating * 10) / 10,
        attendanceReviews,
        taskReviews,
        leaveApprovalsHandled,
        aiMentorScore: Math.min(aiMentorScore, 10),
        performanceTrend,
      },
    });
  } else {
    analytics = await prisma.mentorAnalytics.create({
      data: {
        mentorId,
        totalInterns,
        completedInternships,
        avgRating: Math.round(avgRating * 10) / 10,
        attendanceReviews,
        taskReviews,
        leaveApprovalsHandled,
        aiMentorScore: Math.min(aiMentorScore, 10),
        performanceTrend,
      },
    });
  }

  // Emit socket event
  getSocketIO()?.to(`mentor:${mentorId}`).emit('mentor_analytics_refreshed', analytics);

  return analytics;
};

// ─────────────────────────────────────────────
//  ACTIVITY TIMELINE
// ─────────────────────────────────────────────

/**
 * Get paginated activity timeline
 */
export const getMentorActivity = async (
  mentorId: string,
  page: number = 1,
  limit: number = 20,
  activityType?: string
) => {
  const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
  if (!mentor) throw new AppError('Mentor not found', 404);

  const where: any = { mentorId };
  if (activityType) where.activityType = activityType;

  const skip = (page - 1) * limit;

  const [activities, total] = await prisma.$transaction([
    prisma.mentorActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.mentorActivity.count({ where }),
  ]);

  return {
    data: activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

/**
 * Log an activity event
 */
export const logActivity = async (
  mentorId: string,
  activityType: string,
  description: string,
  metadata?: any
) => {
  return prisma.mentorActivity.create({
    data: {
      mentorId,
      activityType,
      description,
      metadata: metadata || undefined,
    },
  });
};

// ─────────────────────────────────────────────
//  ASSIGNED INTERNS
// ─────────────────────────────────────────────

/**
 * Get interns assigned to a mentor with detailed performance data
 */
export const getMentorInterns = async (mentorId: string) => {
  const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
  if (!mentor) throw new AppError('Mentor not found', 404);

  const interns = await prisma.intern.findMany({
    where: { mentorId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          isActive: true,
        },
      },
      department: true,
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  // Enrich with computed fields
  const enriched = interns.map(intern => {
    const totalTasks = intern.tasks.length;
    const completedTasks = intern.tasks.filter(t => t.status === 'COMPLETED').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Compute internship duration
    const startDate = intern.startDate || intern.joinedDate;
    const endDate = intern.completedDate || new Date();
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    const durationWeeks = Math.ceil(durationDays / 7);

    return {
      id: intern.id,
      userId: intern.userId,
      name: intern.user?.name || '',
      email: intern.user?.email || '',
      avatarUrl: intern.user?.avatarUrl,
      department: intern.department?.name || '',
      attendance: intern.attendance,
      score: intern.score,
      status: intern.status,
      progress,
      totalTasks,
      completedTasks,
      duration: `${durationWeeks} weeks`,
      startDate: startDate.toISOString(),
      joinedDate: intern.joinedDate.toISOString(),
    };
  });

  return enriched;
};

/**
 * Assign a single intern to mentor
 */
export const assignInternToMentor = async (mentorId: string, internId: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: { user: true, interns: true },
  });
  if (!mentor) throw new AppError('Mentor not found', 404);

  // Check capacity
  if (mentor.interns.length >= mentor.mentorCapacity) {
    throw new AppError(
      `Mentor has reached maximum capacity of ${mentor.mentorCapacity} interns`,
      400
    );
  }

  const intern = await prisma.intern.findUnique({
    where: { id: internId },
    include: { user: true },
  });
  if (!intern) throw new AppError('Intern not found', 404);

  if (intern.mentorId === mentorId) {
    throw new AppError('Intern is already assigned to this mentor', 400);
  }

  // Assign
  await prisma.intern.update({
    where: { id: internId },
    data: { mentorId },
  });

  // Log activity
  await logActivity(mentorId, 'INTERN_ASSIGNED', `Intern ${intern.user?.name} assigned`, {
    internId,
    internName: intern.user?.name,
  });

  // Notify mentor
  try {
    await notificationService.createNotification(
      mentor.userId,
      'New Intern Assigned',
      `${intern.user?.name} has been assigned to you.`,
      'SYSTEM',
      { internId, internName: intern.user?.name }
    );
  } catch (err) {
    logger.error('Failed to send intern assignment notification:', err);
  }

  // Notify intern
  if (intern.userId) {
    try {
      await notificationService.createNotification(
        intern.userId,
        'Mentor Assigned',
        `You have been assigned to mentor ${mentor.user?.name}.`,
        'SYSTEM',
        { mentorId, mentorName: mentor.user?.name }
      );
    } catch (err) {
      logger.error('Failed to send mentor assignment notification to intern:', err);
    }
  }

  // Recompute analytics
  try {
    await computeAndStoreAnalytics(mentorId);
  } catch (err) {
    logger.error(`Failed to update analytics on intern assignment for mentor ${mentorId}:`, err);
  }

  // Socket event
  getSocketIO()?.to(`mentor:${mentorId}`).emit('mentor_intern_assigned', {
    mentorId,
    internId,
    internName: intern.user?.name,
  });

  return { success: true, message: `Intern ${intern.user?.name} assigned to mentor` };
};

/**
 * Remove an intern from mentor
 */
export const removeInternFromMentor = async (mentorId: string, internId: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: { user: true },
  });
  if (!mentor) throw new AppError('Mentor not found', 404);

  const intern = await prisma.intern.findUnique({
    where: { id: internId },
    include: { user: true },
  });
  if (!intern) throw new AppError('Intern not found', 404);

  if (intern.mentorId !== mentorId) {
    throw new AppError('Intern is not assigned to this mentor', 400);
  }

  // Remove assignment
  await prisma.intern.update({
    where: { id: internId },
    data: { mentorId: null },
  });

  // Log activity
  await logActivity(mentorId, 'INTERN_REMOVED', `Intern ${intern.user?.name} removed`, {
    internId,
    internName: intern.user?.name,
  });

  // Notify both
  try {
    await notificationService.createNotification(
      mentor.userId,
      'Intern Removed',
      `${intern.user?.name} has been removed from your assignment.`,
      'SYSTEM'
    );
    if (intern.userId) {
      await notificationService.createNotification(
        intern.userId,
        'Mentor Changed',
        `You have been unassigned from mentor ${mentor.user?.name}.`,
        'SYSTEM'
      );
    }
  } catch (err) {
    logger.error('Failed to send intern removal notifications:', err);
  }

  // Recompute analytics
  try {
    await computeAndStoreAnalytics(mentorId);
  } catch (err) {
    logger.error(`Failed to update analytics on intern removal for mentor ${mentorId}:`, err);
  }

  // Socket event
  getSocketIO()?.to(`mentor:${mentorId}`).emit('mentor_intern_removed', {
    mentorId,
    internId,
    internName: intern.user?.name,
  });

  return { success: true, message: `Intern ${intern.user?.name} removed from mentor` };
};

// ─────────────────────────────────────────────
//  DOCUMENTS
// ─────────────────────────────────────────────

/**
 * Get all documents for a mentor
 */
export const getMentorDocuments = async (mentorId: string) => {
  const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
  if (!mentor) throw new AppError('Mentor not found', 404);

  return prisma.mentorDocument.findMany({
    where: { mentorId },
    orderBy: { uploadedAt: 'desc' },
  });
};

/**
 * Upload a document for a mentor (file already uploaded to Cloudinary via multer)
 */
export const uploadMentorDocument = async (
  mentorId: string,
  fileData: { fileName: string; fileUrl: string; fileType: string; fileSize?: number }
) => {
  const mentor = await prisma.mentor.findUnique({ where: { id: mentorId } });
  if (!mentor) throw new AppError('Mentor not found', 404);

  const document = await prisma.mentorDocument.create({
    data: {
      mentorId,
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileType: fileData.fileType,
      fileSize: fileData.fileSize || null,
    },
  });

  // Log activity
  await logActivity(mentorId, 'DOCUMENT_UPLOADED', `Document "${fileData.fileName}" uploaded`, {
    documentId: document.id,
    fileType: fileData.fileType,
  });

  // Socket event
  getSocketIO()?.to(`mentor:${mentorId}`).emit('mentor_document_uploaded', document);

  return document;
};

/**
 * Delete a mentor document
 */
export const deleteMentorDocument = async (mentorId: string, documentId: string) => {
  const document = await prisma.mentorDocument.findUnique({ where: { id: documentId } });

  if (!document) throw new AppError('Document not found', 404);
  if (document.mentorId !== mentorId) throw new AppError('Document does not belong to this mentor', 403);

  // Delete from Cloudinary if possible
  try {
    // Extract public_id from Cloudinary URL
    const urlParts = document.fileUrl.split('/');
    const fileNameWithExt = urlParts[urlParts.length - 1];
    const publicId = fileNameWithExt.split('.')[0];
    const folder = urlParts[urlParts.length - 2];
    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
  } catch (err) {
    logger.warn('Failed to delete file from Cloudinary (may not be Cloudinary URL):', err);
  }

  // Delete from database
  await prisma.mentorDocument.delete({ where: { id: documentId } });

  // Log activity
  await logActivity(mentorId, 'DOCUMENT_DELETED', `Document "${document.fileName}" deleted`, {
    documentId,
  });

  return { success: true, message: 'Document deleted' };
};

// ─────────────────────────────────────────────
//  WORKLOAD ANALYSIS
// ─────────────────────────────────────────────

/**
 * Get workload analysis for a mentor
 */
export const getWorkloadAnalysis = async (mentorId: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: {
      user: { select: { name: true } },
      interns: {
        include: {
          tasks: { where: { status: { in: ['TODO', 'IN_PROGRESS'] } } },
          leaves: { where: { status: 'PENDING' } },
        },
      },
      tasks: {
        where: { status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] } },
      },
    },
  });

  if (!mentor) throw new AppError('Mentor not found', 404);

  const currentInterns = mentor.interns.length;
  const maxCapacity = mentor.mentorCapacity;
  const pendingTasks = mentor.tasks.length;
  const pendingLeaves = mentor.interns.reduce((sum, i) => sum + i.leaves.length, 0);
  const pendingReviews = mentor.tasks.filter(t => t.status === 'REVIEW').length;

  // Workload percentage
  const workloadPercent = maxCapacity > 0 ? Math.round((currentInterns / maxCapacity) * 100) : 0;

  // AI workload status
  let workloadStatus: 'OVERLOADED' | 'BALANCED' | 'AVAILABLE';
  let workloadMessage: string;

  if (workloadPercent >= 90) {
    workloadStatus = 'OVERLOADED';
    workloadMessage = `${mentor.user?.name} is at ${workloadPercent}% capacity. Consider reassigning interns or increasing capacity.`;
  } else if (workloadPercent >= 50) {
    workloadStatus = 'BALANCED';
    workloadMessage = `${mentor.user?.name} has a balanced workload at ${workloadPercent}% capacity.`;
  } else {
    workloadStatus = 'AVAILABLE';
    workloadMessage = `${mentor.user?.name} has availability at ${workloadPercent}% capacity. Can take ${maxCapacity - currentInterns} more interns.`;
  }

  return {
    currentInterns,
    maxCapacity,
    workloadPercent,
    pendingTasks,
    pendingLeaves,
    pendingReviews,
    workloadStatus,
    workloadMessage,
    availableSlots: Math.max(0, maxCapacity - currentInterns),
  };
};

// ─────────────────────────────────────────────
//  AI ANALYSIS
// ─────────────────────────────────────────────

/**
 * Trigger AI analysis for a mentor (with heuristic fallback)
 */
export const getAIMentorAnalysis = async (mentorId: string) => {
  const mentor = await prisma.mentor.findUnique({
    where: { id: mentorId },
    include: {
      user: { select: { name: true } },
      interns: {
        include: {
          tasks: true,
        },
      },
      tasks: true,
      feedbacks: true,
    },
  });

  if (!mentor) throw new AppError('Mentor not found', 404);

  // Compute metrics for AI
  const totalInterns = mentor.interns.length;
  const completedInternships = mentor.interns.filter(i => i.status === 'COMPLETED').length;
  const avgRating =
    mentor.feedbacks.length > 0
      ? mentor.feedbacks.reduce((sum, f) => sum + f.rating, 0) / mentor.feedbacks.length
      : 0;
  const taskCompletionRate =
    mentor.tasks.length > 0
      ? mentor.tasks.filter(t => t.status === 'COMPLETED').length / mentor.tasks.length
      : 0;
  const internSuccessRate = totalInterns > 0 ? completedInternships / totalInterns : 0;

  // Heuristic AI analysis (works without AI microservice)
  const effectivenessScore = Math.round(
    (avgRating / 5) * 30 + taskCompletionRate * 35 + internSuccessRate * 25 + (totalInterns > 0 ? 10 : 0)
  );

  let effectivenessLevel: string;
  if (effectivenessScore >= 80) effectivenessLevel = 'Excellent';
  else if (effectivenessScore >= 60) effectivenessLevel = 'Good';
  else if (effectivenessScore >= 40) effectivenessLevel = 'Average';
  else effectivenessLevel = 'Needs Improvement';

  // Intern satisfaction prediction
  const satisfactionScore = Math.round(
    (avgRating / 5) * 40 + taskCompletionRate * 30 + internSuccessRate * 30
  );

  // Recommendations
  const recommendations: string[] = [];
  if (avgRating < 3) recommendations.push('Consider providing mentorship training to improve feedback ratings.');
  if (taskCompletionRate < 0.5) recommendations.push('Task review rate is below 50%. Schedule regular check-ins with interns.');
  if (totalInterns === 0) recommendations.push('No interns currently assigned. Consider onboarding new interns.');
  if (totalInterns >= mentor.mentorCapacity) recommendations.push('At full capacity. Consider requesting capacity increase or delegation.');
  if (recommendations.length === 0) recommendations.push('Performance metrics are strong. Keep up the great work!');

  const analysis = {
    mentorName: mentor.user?.name,
    effectivenessScore,
    effectivenessLevel,
    satisfactionScore,
    avgRating: Math.round(avgRating * 10) / 10,
    taskCompletionRate: Math.round(taskCompletionRate * 100),
    internSuccessRate: Math.round(internSuccessRate * 100),
    totalInterns,
    completedInternships,
    recommendations,
    analyzedAt: new Date().toISOString(),
  };

  // Update AI score in analytics
  const existingAnalytics = await prisma.mentorAnalytics.findFirst({ where: { mentorId } });
  if (existingAnalytics) {
    await prisma.mentorAnalytics.update({
      where: { id: existingAnalytics.id },
      data: { aiMentorScore: effectivenessScore / 10 },
    });
  }

  // Log activity
  await logActivity(mentorId, 'AI_ANALYSIS', `AI effectiveness analysis completed: ${effectivenessLevel}`, {
    effectivenessScore,
    satisfactionScore,
  });

  return analysis;
};
