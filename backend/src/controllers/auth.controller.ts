import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { successResponse } from '../utils/response';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import prisma from '../config/database';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { generateTokenPair } from '../utils/jwt';
import { sendLoginOtpEmail } from '../utils/email';
import { parseUserAgent } from '../utils/userAgent';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  RefreshTokenInput,
} from '../validations/auth.validation';
import { logAction } from '../services/auditLog.service';

import { emailQueue } from '../queues/queue.config';

/**
 * Register new user
 * POST /api/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, role } = req.body as RegisterInput;

  const result = await authService.registerUser(email, password, name, role);

  if (role === 'INTERN') {
    await emailQueue.add('WELCOME_EMAIL', {
      to: email,
      data: {
        name: name,
        email: email,
        temporaryPassword: password, // Note: storing/sending raw password. Only good if it's generated/temporary.
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
      }
    });
  }

  successResponse(res, 'User registered successfully', result, 201);
});


/**
 * Login user
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const result = await authService.loginUser(email, password);

  await logAction(result.user.id, 'LOGIN', 'User', result.user.id, { method: 'DIRECT' }, req);

  successResponse(res, 'Login successful', result);
});

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  await authService.logoutUser(userId);

  await logAction(userId, 'LOGOUT', 'User', userId, {}, req);

  successResponse(res, 'Logout successful');
});

/**
 * Refresh access token
 * POST /api/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body as RefreshTokenInput;

  const tokens = await authService.refreshAccessToken(refreshToken);

  successResponse(res, 'Token refreshed successfully', tokens);
});

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as ForgotPasswordInput;

  await authService.requestPasswordReset(email);

  successResponse(
    res,
    'If an account exists with this email, a password reset link has been sent'
  );
});

/**
 * Reset password
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body as ResetPasswordInput;

  await authService.resetPassword(token, password);

  successResponse(res, 'Password reset successful');
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const user = await authService.getCurrentUser(userId);

  successResponse(res, 'User profile retrieved successfully', user);
});

/**
 * Send Login Verification OTP
 * POST /api/auth/send-otp
 */
export const sendOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, deviceFingerprint } = req.body;
  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
  const ua = parseUserAgent(req.headers['user-agent']);

  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403);
  }

  // 2. Verify password
  let isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    // Log failed attempt
    await prisma.loginActivity.create({
      data: {
        userId: user.id,
        status: 'FAILED',
        browser: ua.browser,
        device: ua.device,
        ipAddress: String(ipAddress)
      }
    });
    throw new AppError('Invalid email or password', 401);
  }

  // 3. Trusted Session check (3 hours active session bypass system)
  if (deviceFingerprint) {
    const trustedSession = await prisma.trustedSession.findFirst({
      where: {
        userId: user.id,
        deviceFingerprint,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      }
    });

    if (trustedSession) {
      // Check suspicious indicators:
      const browserChanged = trustedSession.browser !== ua.browser;
      const osChanged = trustedSession.operatingSystem !== ua.device;

      // Count failures in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const failedCount = await prisma.loginActivity.count({
        where: {
          userId: user.id,
          status: 'FAILED',
          createdAt: { gt: fiveMinutesAgo }
        }
      });

      const isSuspicious = browserChanged || osChanged || failedCount >= 3;

      if (!isSuspicious) {
        // Direct Login flow! Bypasses OTP!
        // Extend session by 3 hours (Auto Session Refresh)
        const newExpiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
        await prisma.trustedSession.update({
          where: { id: trustedSession.id },
          data: {
            expiresAt: newExpiresAt,
            lastActivityAt: new Date(),
            ipAddress: String(ipAddress)
          }
        });

        const payload = { userId: user.id, email: user.email, role: user.role };
        const tokens = generateTokenPair(payload);

        await prisma.user.update({
          where: { id: user.id },
          data: {
            refreshToken: tokens.refreshToken,
            lastLogin: new Date()
          }
        });

        await prisma.loginActivity.create({
          data: {
            userId: user.id,
            status: 'SUCCESS',
            browser: ua.browser,
            device: ua.device,
            ipAddress: String(ipAddress)
          }
        });

        await logAction(user.id, 'LOGIN', 'User', user.id, { method: 'TRUSTED_SESSION' }, req);

        const { password: _, refreshToken: __, ...safeUser } = user as any;

        successResponse(res, 'Direct login successful (Recognized active trusted session)', {
          directLogin: true,
          user: safeUser,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        });
        return;
      }
    }
  }

  // 4. Cooldown check: resend cooldown = 30 seconds
  const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
  const recentOtp = await prisma.otpVerification.findFirst({
    where: {
      userId: user.id,
      verified: false,
      createdAt: { gt: thirtySecondsAgo }
    }
  });

  if (recentOtp) {
    throw new AppError('Please wait 30 seconds before requesting a new OTP.', 429);
  }

  // 5. Generate 6-digit numeric OTP
  const otpRaw = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedOtp = crypto.createHash('sha256').update(otpRaw).digest('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

  // 6. Invalidate previous unverified OTPs
  await prisma.otpVerification.updateMany({
    where: { userId: user.id, verified: false },
    data: { verified: true }
  });

  // 7. Save hashed OTP to database
  await prisma.otpVerification.create({
    data: {
      userId: user.id,
      otpCode: hashedOtp,
      expiresAt
    }
  });

  // 8. Trigger SMTP Nodemailer OTP Email
  const timestampStr = new Date().toLocaleString();
  await sendLoginOtpEmail(user.email, user.name, otpRaw, String(ipAddress), timestampStr);

  successResponse(res, 'Verification OTP sent to your registered email address.', {
    directLogin: false
  });
});

/**
 * Verify Login OTP and Establish Trusted Session (3 hours valid)
 * POST /api/auth/verify-otp
 */
export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, otpCode, deviceFingerprint } = req.body;
  if (!email || !password || !otpCode) {
    throw new AppError('Email, password, and OTP code are required', 400);
  }

  // 1. Find user and verify credentials
  const user = await prisma.user.findUnique({
    where: { email }
  });

  const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown IP';
  const ua = parseUserAgent(req.headers['user-agent']);

  let isPasswordValid = false;
  if (user) {
    isPasswordValid = await bcrypt.compare(password, user.password);
  }

  if (!user || !isPasswordValid) {
    throw new AppError('Invalid email, password, or verification code', 401);
  }

  // 2. Fetch the active unverified OTP for the user
  const latestOtp = await prisma.otpVerification.findFirst({
    where: {
      userId: user.id,
      verified: false
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!latestOtp) {
    throw new AppError('Verification code not found or expired', 400);
  }

  // Check expiration (5 minutes)
  if (latestOtp.expiresAt < new Date()) {
    throw new AppError('Verification code has expired. Please request a new one.', 400);
  }

  // Verify attempt count limit (max 3 verification attempts)
  if (latestOtp.attempts >= 3) {
    await prisma.otpVerification.update({
      where: { id: latestOtp.id },
      data: { verified: true } // invalidate it
    });
    throw new AppError('Maximum verification attempts exceeded. Please request a new OTP.', 400);
  }

  // 3. Hash input code to verify against stored SHA-256 hash
  const hashedInputCode = crypto.createHash('sha256').update(otpCode).digest('hex');
  if (latestOtp.otpCode !== hashedInputCode) {
    // Increment verification attempts
    await prisma.otpVerification.update({
      where: { id: latestOtp.id },
      data: { attempts: { increment: 1 } }
    });
    throw new AppError('Invalid verification code. Please try again.', 400);
  }

  // 4. Mark OTP as verified (invalidate after success)
  await prisma.otpVerification.update({
    where: { id: latestOtp.id },
    data: { verified: true }
  });

  // 5. Establish Trusted Device Session System (Expires in 3 hours)
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000); // 3 hours valid

  if (deviceFingerprint) {
    // Deactivate previous active trusted sessions on this same device finger
    await prisma.trustedSession.updateMany({
      where: { userId: user.id, deviceFingerprint, status: 'ACTIVE' },
      data: { status: 'EXPIRED' }
    });

    await prisma.trustedSession.create({
      data: {
        userId: user.id,
        sessionToken,
        deviceFingerprint,
        browser: ua.browser,
        operatingSystem: ua.device,
        ipAddress: String(ipAddress),
        status: 'ACTIVE',
        lastActivityAt: new Date(),
        expiresAt
      }
    });
  }

  // 6. Generate JWT Access and Refresh tokens
  const payload = { userId: user.id, email: user.email, role: user.role };
  const tokens = generateTokenPair(payload);

  // Update refresh token on user model
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: tokens.refreshToken,
      lastLogin: new Date()
    }
  });

  // 7. Write Login Activity Log
  await prisma.loginActivity.create({
    data: {
      userId: user.id,
      status: 'SUCCESS',
      browser: ua.browser,
      device: ua.device,
      ipAddress: String(ipAddress)
    }
  });

  await logAction(user.id, 'LOGIN', 'User', user.id, { method: 'OTP' }, req);

  // Sanitize and return User details
  const { password: _, refreshToken: __, ...safeUser } = user as any;

  successResponse(res, 'Login verification completed successfully', {
    user: safeUser,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    sessionToken
  });
});

/**
 * Logout all devices and revoke trusted device sessions
 * POST /api/auth/logout-all
 */
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  // Revoke all active trusted sessions for this user in DB
  await prisma.trustedSession.updateMany({
    where: { userId, status: 'ACTIVE' },
    data: { status: 'REVOKED' }
  });

  // Invalidate refresh token on user model
  await prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null }
  });

  successResponse(res, 'Logged out from all devices successfully.');
});

/**
 * Auto Refresh Trusted Session Keep-Alive Loop
 * POST /api/auth/refresh-session
 */
export const refreshSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { deviceFingerprint } = req.body;

  if (!deviceFingerprint) {
    throw new AppError('Device fingerprint is required to refresh session.', 400);
  }

  // Find active trusted session matching fingerprint and userId
  const trustedSession = await prisma.trustedSession.findFirst({
    where: {
      userId,
      deviceFingerprint,
      status: 'ACTIVE',
      expiresAt: { gt: new Date() }
    }
  });

  if (!trustedSession) {
    throw new AppError('Active trusted session expired or invalid. Please login again.', 401);
  }

  // Auto Session Refresh: Extend expiresAt by 3 hours
  const newExpiresAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
  await prisma.trustedSession.update({
    where: { id: trustedSession.id },
    data: {
      expiresAt: newExpiresAt,
      lastActivityAt: new Date()
    }
  });

  // Generate fresh JWT token pair
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const payload = { userId: user.id, email: user.email, role: user.role };
  const tokens = generateTokenPair(payload);

  successResponse(res, 'Trusted session extended and tokens refreshed.', {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: newExpiresAt
  });
});
