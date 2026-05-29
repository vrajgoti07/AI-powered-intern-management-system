import { Request, Response, NextFunction } from 'express';
import { PrismaClient, AnnouncementPriority, UserRole } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/response';
import { sendAnnouncementEmail } from '../utils/email';
import notificationService from '../services/notification.service';

const prisma = new PrismaClient();

/**
 * @desc    Get all announcements (filtered by audience for the requesting user)
 * @route   GET /api/announcements
 * @access  Private
 */
export const getAnnouncements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;

  let audienceFilter: any = { equals: 'All' };

  if (user?.role === UserRole.HR || user?.role === UserRole.SUPER_ADMIN) {
    // HR and Super Admins see all announcements
    audienceFilter = undefined; 
  } else if (user?.role === UserRole.INTERN) {
    // Interns see "All", "Interns", and their specific department
    const intern = await prisma.intern.findUnique({
      where: { userId: user.id },
      include: { department: true }
    });
    
    if (intern) {
      audienceFilter = {
        in: ['All', 'Interns', intern.department.name]
      };
    } else {
      audienceFilter = { in: ['All', 'Interns'] };
    }
  } else if (user?.role === UserRole.MENTOR) {
    // Mentors see "All", "Mentors", and their specific department
    const mentor = await prisma.mentor.findUnique({
      where: { userId: user.id },
      include: { department: true }
    });
    
    if (mentor) {
      audienceFilter = {
        in: ['All', 'Mentors', mentor.department.name]
      };
    } else {
      audienceFilter = { in: ['All', 'Mentors'] };
    }
  }

  const whereClause = audienceFilter ? { audience: audienceFilter } : {};

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    successResponse(res, 'Announcements retrieved successfully', announcements);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new announcement
 * @route   POST /api/announcements
 * @access  Private (HR/Admin)
 */
export const createAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, content, priority, audience } = req.body;
    const user = req.user;

    if (!title || !content || !audience) {
      errorResponse(res, 'Title, content, and audience are required', 400);
      return;
    }

  // Parse priority
  let parsedPriority: AnnouncementPriority = AnnouncementPriority.MEDIUM;
  if (priority === 'High') parsedPriority = AnnouncementPriority.HIGH;
  if (priority === 'Low') parsedPriority = AnnouncementPriority.LOW;

  // Create announcement in DB
  const announcement = await prisma.announcement.create({
    data: {
      title,
      content,
      priority: parsedPriority,
      audience,
      author: user?.name || 'HR Admin',
    },
  });

  // Fetch target emails
  let targetEmails: string[] = [];
  
  if (audience === 'All') {
    const allUsers = await prisma.user.findMany({ 
      where: { isActive: true },
      select: { email: true } 
    });
    targetEmails = allUsers.map(u => u.email);
  } else if (audience === 'Interns') {
    const interns = await prisma.user.findMany({
      where: { role: UserRole.INTERN, isActive: true },
      select: { email: true }
    });
    targetEmails = interns.map(u => u.email);
  } else if (audience === 'Mentors') {
    const mentors = await prisma.user.findMany({
      where: { role: UserRole.MENTOR, isActive: true },
      select: { email: true }
    });
    targetEmails = mentors.map(u => u.email);
  } else {
    // Specific department name e.g. "Engineering"
    const deptUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { intern: { department: { name: audience } } },
          { mentor: { department: { name: audience } } }
        ]
      },
      select: { email: true }
    });
    targetEmails = deptUsers.map(u => u.email);
  }

    // Send broadcast email if we have targets
    if (targetEmails.length > 0) {
      // Run async so we don't block the HTTP response
      sendAnnouncementEmail(
        targetEmails,
        announcement.title,
        announcement.content,
        announcement.author,
        announcement.priority
      ).catch(err => console.error("Error sending announcement broadcast:", err));
    }
    
    // Real-time Socket & DB Notifications
    const eventPayload = {
      title: announcement.title,
      message: announcement.content,
      type: 'ANNOUNCEMENT',
      payload: announcement
    };

    if (audience === 'All') {
      await notificationService.sendToAll('announcement:new', eventPayload);
    } else if (audience === 'Interns') {
      await notificationService.sendToRole(UserRole.INTERN, 'announcement:new', eventPayload);
    } else if (audience === 'Mentors') {
      await notificationService.sendToRole(UserRole.MENTOR, 'announcement:new', eventPayload);
    } else {
      const dept = await prisma.department.findUnique({ where: { name: audience } });
      if (dept) {
        await notificationService.sendToDepartment(dept.id, 'announcement:new', eventPayload);
      }
    }

    successResponse(res, 'Announcement published successfully', announcement, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Remove an announcement
 * @route   DELETE /api/announcements/:id
 * @access  Private (HR/Admin)
 */
export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const user = req.user;

    // Check RBAC role
    if (user?.role !== UserRole.HR && user?.role !== UserRole.SUPER_ADMIN) {
      errorResponse(res, 'Unauthorized access. Only HR and Admins can delete broadcasts.', 403);
      return;
    }

    const existing = await prisma.announcement.findUnique({
      where: { id }
    });

    if (!existing) {
      errorResponse(res, 'Announcement not found', 404);
      return;
    }

    await prisma.announcement.delete({
      where: { id }
    });

    successResponse(res, 'Announcement deleted successfully');
  } catch (error) {
    next(error);
  }
};
