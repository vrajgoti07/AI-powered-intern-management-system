import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { config } from '../config/env';

/**
 * JWT Payload Interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Generate Access Token
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiry as StringValue,
  };
  return jwt.sign(payload, config.jwt.accessSecret, options);
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiry as StringValue,
  };
  return jwt.sign(payload, config.jwt.refreshSecret, options);
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate Token Pair (Access + Refresh)
 */
export const generateTokenPair = (payload: JwtPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

/**
 * Generate 2FA Pending Token (expires in 5 minutes)
 */
export const generatePending2faToken = (userId: string): string => {
  return jwt.sign({ userId, type: '2fa_pending' }, config.jwt.accessSecret, {
    expiresIn: '5m',
  });
};

/**
 * Verify 2FA Pending Token
 */
export const verifyPending2faToken = (token: string): { userId: string } => {
  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as any;
    if (decoded.type !== '2fa_pending') {
      throw new Error('Invalid token type');
    }
    return { userId: decoded.userId };
  } catch (error) {
    throw new Error('Invalid or expired 2FA pending token');
  }
};

