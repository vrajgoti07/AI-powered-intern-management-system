import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import { comparePassword, hashPassword } from '../utils/password';
import { SafeUser } from '../types';

/**
 * Remove sensitive fields from user object
 */
const sanitizeUser = (user: any): SafeUser => {
  const { password, refreshToken, resetPasswordToken, resetPasswordTokenExpiry, ...safeUser } = user;
  return safeUser;
};

/**
 * Get user profile
 */
export const getUserProfile = async (userId: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      intern: {
        include: {
          department: true,
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
      mentor: {
        include: {
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
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  return sanitizeUser(user);
};

/**
 * Update user profile
 */
export const updateUserProfile = async (
  userId: string,
  data: {
    name?: string;
    avatarUrl?: string | null;
  }
): Promise<SafeUser> => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Update user
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    include: {
      intern: {
        include: {
          department: true,
          mentor: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
      mentor: {
        include: {
          department: true,
        },
      },
    },
  });

  return sanitizeUser(user);
};

/**
 * Change user password
 */
export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and invalidate all sessions
  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      refreshToken: null, // Invalidate all sessions
    },
  });
};

/**
 * Deactivate user account
 */
export const deactivateUserAccount = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: false,
      refreshToken: null, // Invalidate all sessions
    },
  });
};

/**
 * Activate user account
 */
export const activateUserAccount = async (userId: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      isActive: true,
    },
  });
};
