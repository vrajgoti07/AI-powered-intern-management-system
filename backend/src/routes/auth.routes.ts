import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
} from '../validations/auth.validation';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Direct Login
 *     description: Authenticate a user directly with email and password, returning a JWT token pair.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: intern@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "user-uuid"
 *                         email:
 *                           type: string
 *                           example: intern@example.com
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         role:
 *                           type: string
 *                           example: INTERN
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOi..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOi..."
 *                 timestamp:
 *                   type: string
 *                   example: "2026-05-20T10:30:00.000Z"
 *       400:
 *         description: Bad request (e.g. invalid validation inputs).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation error
 *                 error:
 *                   type: string
 *                   example: "Email and password are required"
 *                 timestamp:
 *                   type: string
 *                   example: "2026-05-20T10:30:00.000Z"
 *       401:
 *         description: Unauthorized (invalid credentials).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *                 error:
 *                   type: string
 *                   example: "Invalid email or password"
 *                 timestamp:
 *                   type: string
 *                   example: "2026-05-20T10:30:00.000Z"
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

/**
 * @swagger
 * /api/v1/auth/send-otp:
 *   post:
 *     summary: Send Login Verification OTP
 *     description: Verify credentials and send a 6-digit verification code to the registered email. Bypasses if a recognized active trusted session is found.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: intern@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               deviceFingerprint:
 *                 type: string
 *                 example: "device-uuid-or-hash"
 *     responses:
 *       200:
 *         description: Direct login via recognized session OR OTP successfully sent to email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Verification OTP sent to your registered email address."
 *                 data:
 *                   type: object
 *                   properties:
 *                     directLogin:
 *                       type: boolean
 *                       example: false
 *                 timestamp:
 *                   type: string
 *                   example: "2026-05-20T10:30:00.000Z"
 *       400:
 *         description: Bad request (missing required email/password inputs).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Email and password are required
 *                 timestamp:
 *                   type: string
 *                   example: "2026-05-20T10:30:00.000Z"
 *       401:
 *         description: Unauthorized (invalid credentials).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *                 timestamp:
 *                   type: string
 *                   example: "2026-05-20T10:30:00.000Z"
 */
router.post(
  '/send-otp',
  authLimiter,
  authController.sendOtp
);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Verify Login OTP
 *     description: Verify the email, password, and the 6-digit OTP code. Establishes a trusted session for 3 hours and issues JWT tokens.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - otpCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: intern@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *               otpCode:
 *                 type: string
 *                 example: "123456"
 *               deviceFingerprint:
 *                 type: string
 *                 example: "device-uuid-or-hash"
 *     responses:
 *       200:
 *         description: OTP verification successful and trusted session established.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login verification completed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "user-uuid"
 *                         email:
 *                           type: string
 *                           example: intern@example.com
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         role:
 *                           type: string
 *                           example: INTERN
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOi..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOi..."
 *                     sessionToken:
 *                       type: string
 *                       example: "session-token-hex"
 *                 timestamp:
 *                   type: string
 *                   example: "2026-05-20T10:30:00.000Z"
 *       400:
 *         description: Bad request (missing fields, code expired, max attempts exceeded, or invalid code).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Email, password, and OTP code are required"
 *                 timestamp:
 *                   type: string
 *                   example: "2026-05-20T10:30:00.000Z"
 *       401:
 *         description: Unauthorized (invalid credentials).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid email, password, or verification code
 *                 timestamp:
 *                   type: string
 *                   example: "2026-05-20T10:30:00.000Z"
 */
router.post(
  '/verify-otp',
  authLimiter,
  authController.verifyOtp
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  validate(refreshTokenSchema),
  authController.refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/forgot-password-send-otp
 * @desc    Send OTP for password reset
 * @access  Public
 */
router.post(
  '/forgot-password-send-otp',
  passwordResetLimiter,
  authController.forgotPasswordSendOtp
);

/**
 * @route   POST /api/auth/forgot-password-verify-otp
 * @desc    Verify OTP for password reset
 * @access  Public
 */
router.post(
  '/forgot-password-verify-otp',
  passwordResetLimiter,
  authController.forgotPasswordVerifyOtp
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password
 * @access  Public
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

router.post(
  '/logout-all',
  authenticate,
  authController.logoutAll
);

router.post(
  '/refresh-session',
  authenticate,
  authController.refreshSession
);

export default router;
