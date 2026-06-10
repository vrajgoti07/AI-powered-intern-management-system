import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import prisma from '../config/database';
import { successResponse } from '../utils/response';
import { comparePassword } from '../utils/password';
import { generateTokenPair } from '../utils/jwt';
import { logAction } from '../services/auditLog.service';
import {
  generateSetupDetails,
  encryptSecret,
  decryptSecret,
  verifyTOTP,
  generateBackupCodes,
  verifyAndConsumeBackupCode,
} from '../services/totp.service';
import { verifyPending2faToken } from '../utils/jwt';

/**
 * Helper to remove sensitive fields from user object
 */
const sanitizeUser = (user: any) => {
  const { password, refreshToken, resetPasswordToken, resetPasswordTokenExpiry, totpSecret, totpBackupCodes, ...safeUser } = user;
  return safeUser;
};

/**
 * 2FA Setup Flow (Requires authenticated session)
 * POST /api/auth/2fa/setup
 */
export const setup2FA = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { password } = req.body;

  if (!password) {
    throw new AppError('Password is required to setup 2FA', 400);
  }

  // Fetch full user record to compare password
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid password', 401);
  }

  // Generate TOTP secret and QR Code data URL
  const { secret, qrCodeDataUrl } = await generateSetupDetails(user.email);

  // Encrypt and temporarily save the secret
  const encryptedSecret = encryptSecret(secret);
  await prisma.user.update({
    where: { id: userId },
    data: {
      totpSecret: encryptedSecret,
      totpEnabled: false, // Not enabled yet until verified
    },
  });

  successResponse(res, '2FA setup initiated successfully', {
    secret,
    qrCodeDataUrl,
  });
});

/**
 * 2FA Confirm / Enable Flow (Requires authenticated session)
 * POST /api/auth/2fa/enable
 */
export const enable2FA = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { token } = req.body;

  if (!token) {
    throw new AppError('Verification token (6-digit code) is required', 400);
  }

  // Fetch user
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.totpSecret) {
    throw new AppError('2FA setup has not been initiated. Please run setup first.', 400);
  }

  // Decrypt secret and verify
  const plainSecret = decryptSecret(user.totpSecret);
  const isValid = verifyTOTP(plainSecret, token);

  if (!isValid) {
    throw new AppError('Invalid verification code. Please try again.', 400);
  }

  // Generate backup recovery codes
  const { plain: plainBackupCodes, hashed: hashedBackupCodes } = await generateBackupCodes();

  // Save changes to user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totpEnabled: true,
      totpVerifiedAt: new Date(),
      totpBackupCodes: hashedBackupCodes,
    },
  });

  await logAction(userId, 'ENABLE_2FA', 'User', userId, {}, req);

  successResponse(res, 'Two-factor authentication enabled successfully', {
    backupCodes: plainBackupCodes,
    user: sanitizeUser(updatedUser),
  });
});

/**
 * 2FA Disable Flow (Requires authenticated session)
 * POST /api/auth/2fa/disable
 */
export const disable2FA = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;
  const { password, token } = req.body;

  if (!password || !token) {
    throw new AppError('Password and verification token are required to disable 2FA', 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new AppError('Invalid password', 401);
  }

  if (!user.totpSecret || !user.totpEnabled) {
    throw new AppError('2FA is not enabled on this account', 400);
  }

  // Decrypt secret and verify (Accept standard TOTP token or backup code)
  const plainSecret = decryptSecret(user.totpSecret);
  let isValid = verifyTOTP(plainSecret, token);

  if (!isValid) {
    // Check if it's a valid backup code
    isValid = await verifyAndConsumeBackupCode(userId, token, user.totpBackupCodes);
  }

  if (!isValid) {
    throw new AppError('Invalid verification token or backup code', 400);
  }

  // Disable 2FA
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      totpEnabled: false,
      totpSecret: null,
      totpVerifiedAt: null,
      totpBackupCodes: [],
    },
  });

  await logAction(userId, 'DISABLE_2FA', 'User', userId, {}, req);

  successResponse(res, 'Two-factor authentication disabled successfully', {
    user: sanitizeUser(updatedUser),
  });
});

/**
 * 2FA Verify Flow (Public Endpoint - Login Step 2)
 * POST /api/auth/2fa/verify
 */
export const verify2FA = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { pendingToken, code } = req.body;

  if (!pendingToken || !code) {
    throw new AppError('Pending token and 2FA code are required', 400);
  }

  // 1. Verify pendingToken
  let decoded: { userId: string };
  try {
    decoded = verifyPending2faToken(pendingToken);
  } catch (err: any) {
    throw new AppError(err.message || 'Invalid or expired pending token', 401);
  }

  // 2. Fetch full user
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: {
      intern: {
        include: {
          department: true,
          mentor: {
            include: {
              user: {
                select: {
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
      headedDepartment: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403);
  }

  if (!user.totpSecret || !user.totpEnabled) {
    throw new AppError('2FA is not enabled on this account', 400);
  }

  // 3. Verify token or backup code
  const plainSecret = decryptSecret(user.totpSecret);
  let isValid = verifyTOTP(plainSecret, code);
  let isBackupCodeUsed = false;

  if (!isValid) {
    // Verify backup code (which consumes it)
    isValid = await verifyAndConsumeBackupCode(user.id, code, user.totpBackupCodes);
    isBackupCodeUsed = isValid;
  }

  if (!isValid) {
    throw new AppError('Invalid verification code or backup code', 401);
  }

  // 4. Verification successful! Establish full session
  const payload = { userId: user.id, email: user.email, role: user.role };
  const tokens = generateTokenPair(payload);

  // Update refresh token and last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: tokens.refreshToken,
      lastLogin: new Date(),
    },
  });

  // Log successful login
  const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
  await prisma.loginActivity.create({
    data: {
      userId: user.id,
      status: 'SUCCESS',
      browser: req.headers['user-agent'] || 'Unknown',
      device: 'Desktop/Mobile',
      ipAddress: String(ipAddress),
    },
  });

  await logAction(
    user.id,
    'LOGIN',
    'User',
    user.id,
    { method: isBackupCodeUsed ? '2FA_BACKUP_CODE' : '2FA_TOTP' },
    req
  );

  successResponse(res, 'Two-factor verification successful', {
    user: sanitizeUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });
});

/**
 * 2FA Status (Requires authenticated session)
 * GET /api/auth/2fa/status
 */
export const get2FAStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      totpEnabled: true,
      totpVerifiedAt: true,
      totpBackupCodes: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  successResponse(res, '2FA status retrieved successfully', {
    enabled: user.totpEnabled,
    verifiedAt: user.totpVerifiedAt,
    remainingBackupCodesCount: user.totpBackupCodes.length,
  });
});
