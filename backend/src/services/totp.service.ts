import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Derives a 32-byte encryption key from the environment variable.
 */
const getEncryptionKey = (): Buffer => {
  const envKey = process.env.TOTP_ENCRYPTION_KEY || 'internflow-default-secret-totp-encryption-key-32bytes-fallback';
  return crypto.createHash('sha256').update(envKey).digest();
};

/**
 * Encrypt plain text using AES-256-CBC
 */
export const encryptSecret = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt encrypted text using AES-256-CBC
 */
export const decryptSecret = (encryptedText: string): string => {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted secret format');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Generate a new TOTP secret and QR code URL
 */
export const generateSetupDetails = async (email: string) => {
  const secret = speakeasy.generateSecret({
    name: `InternFlow:${email}`,
    issuer: 'InternFlow',
  });

  if (!secret.otpauth_url) {
    throw new AppError('Failed to generate OTPAuth URL', 500);
  }

  // Generate QR code data URL
  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCodeDataUrl,
  };
};

/**
 * Verify a TOTP token against a decrypted base32 secret
 */
export const verifyTOTP = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 1, // Allow 1 step (30s) drift backward/forward
  });
};

/**
 * Generate 8 backup recovery codes (each formatted as xxxx-xxxx)
 * Returns plain codes for the user and hashed codes for saving
 */
export const generateBackupCodes = async (): Promise<{ plain: string[]; hashed: string[] }> => {
  const codes: string[] = [];
  const hashed: string[] = [];

  for (let i = 0; i < 8; i++) {
    // Generate 8 random characters formatted as xxxx-xxxx
    const rand = crypto.randomBytes(4).toString('hex'); // 8 hex characters
    const formatted = `${rand.slice(0, 4)}-${rand.slice(4)}`;
    codes.push(formatted);
    
    // Hash using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(formatted, salt);
    hashed.push(hash);
  }

  return { plain: codes, hashed };
};

/**
 * Check a backup code against user's stored backup codes.
 * Returns the index of the matching code if valid, otherwise -1.
 */
export const verifyAndConsumeBackupCode = async (
  userId: string,
  backupCode: string,
  storedHashedCodes: string[]
): Promise<boolean> => {
  // Clean input code
  const cleanCode = backupCode.trim().toLowerCase();

  for (let i = 0; i < storedHashedCodes.length; i++) {
    const isMatch = await bcrypt.compare(cleanCode, storedHashedCodes[i]);
    if (isMatch) {
      // Remove the consumed backup code from the database
      const updatedCodes = storedHashedCodes.filter((_, idx) => idx !== i);
      await prisma.user.update({
        where: { id: userId },
        data: { totpBackupCodes: updatedCodes },
      });
      return true;
    }
  }

  return false;
};
