import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/error.middleware';

/**
 * Get profile settings details dynamically by user role
 */
export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        intern: {
          include: { department: true }
        },
        mentor: {
          include: { department: true }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    successResponse(res, 'Profile details retrieved successfully', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive
      },
      intern: user.intern,
      mentor: user.mentor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update profile details dynamically depending on user role
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { name, phone, dob, college, degree, branch, cgpa, skills, address, workAddress, designation, experience, bio, expertise } = req.body;

    // Handle uploaded file url (like profile pictures or resumes) if uploaded via static middleware
    let fileUrl = '';
    if (req.file) {
      fileUrl = (req.file as any).secure_url || (req.file as any).url || (req.file as any).path;
      if (!(req.file as any).secure_url && (req.file as any).filename) {
        fileUrl = `http://localhost:5000/uploads/${(req.file as any).filename}`;
      }
    }

    // 1. Update basic User profile name and avatar
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || undefined,
        avatarUrl: req.body.avatarUrl === null ? null : (req.body.isAvatarUpload && fileUrl ? fileUrl : undefined)
      }
    });

    // 2. Role-specific detail updates
    if (role === 'INTERN') {
      const parsedSkills = typeof skills === 'string' ? skills.split(',').map((s: string) => s.trim()).filter(Boolean) : skills;
      await prisma.intern.update({
        where: { userId },
        data: {
          phone: phone !== undefined ? phone : undefined,
          dob: dob ? new Date(dob) : undefined,
          college: college || undefined,
          degree: degree !== undefined ? degree : undefined,
          branch: branch !== undefined ? branch : undefined,
          cgpa: cgpa ? parseFloat(cgpa) : undefined,
          skills: parsedSkills !== undefined ? parsedSkills : undefined,
          address: address !== undefined ? address : undefined,
          workAddress: workAddress !== undefined ? workAddress : undefined,
          resumeUrl: !req.body.isAvatarUpload && fileUrl ? fileUrl : undefined
        }
      });
    } else if (role === 'MENTOR') {
      const parsedExpertise = typeof expertise === 'string' ? expertise.split(',').map((e: string) => e.trim()).filter(Boolean) : expertise;
      const parsedSkills = typeof skills === 'string' ? skills.split(',').map((s: string) => s.trim()).filter(Boolean) : skills;
      await prisma.mentor.update({
        where: { userId },
        data: {
          phone: phone !== undefined ? phone : undefined,
          designation: designation !== undefined ? designation : undefined,
          experience: experience ? parseInt(experience, 10) : undefined,
          bio: bio !== undefined ? bio : undefined,
          expertise: parsedExpertise !== undefined ? parsedExpertise : undefined,
          skills: parsedSkills !== undefined ? parsedSkills : undefined
        }
      });
    }

    // Return the updated data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        intern: {
          include: { department: true }
        },
        mentor: {
          include: { department: true }
        }
      }
    });

    successResponse(res, 'Profile details updated successfully', user);
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification preferences for the user (create default if missing)
 */
export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId }
    });

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: { userId }
      });
    }

    successResponse(res, 'Notification preferences retrieved successfully', prefs);
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification preferences
 */
export const updateNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { emailNotifications, attendanceAlerts, leaveAlerts, taskAlerts, announcementAlerts } = req.body;

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        emailNotifications: emailNotifications !== undefined ? !!emailNotifications : undefined,
        attendanceAlerts: attendanceAlerts !== undefined ? !!attendanceAlerts : undefined,
        leaveAlerts: leaveAlerts !== undefined ? !!leaveAlerts : undefined,
        taskAlerts: taskAlerts !== undefined ? !!taskAlerts : undefined,
        announcementAlerts: announcementAlerts !== undefined ? !!announcementAlerts : undefined
      },
      create: {
        userId,
        emailNotifications: emailNotifications !== undefined ? !!emailNotifications : true,
        attendanceAlerts: attendanceAlerts !== undefined ? !!attendanceAlerts : true,
        leaveAlerts: leaveAlerts !== undefined ? !!leaveAlerts : true,
        taskAlerts: taskAlerts !== undefined ? !!taskAlerts : true,
        announcementAlerts: announcementAlerts !== undefined ? !!announcementAlerts : true
      }
    });

    successResponse(res, 'Notification preferences updated successfully', prefs);
  } catch (error) {
    next(error);
  }
};
