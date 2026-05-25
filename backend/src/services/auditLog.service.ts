import prisma from '../config/database';
import { Request } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Creates an AuditLog record in the database
 */
export const logAction = async (
  userId: string | null,
  action: string,
  entity: string,
  entityId: string,
  metadata?: any,
  req?: Request
): Promise<void> => {
  try {
    let ipAddress: string | null = null;
    if (req) {
      const forwarded = req.headers ? req.headers['x-forwarded-for'] : undefined;
      ipAddress = typeof forwarded === 'string' 
        ? forwarded.split(',')[0].trim() 
        : req.ip || req.socket?.remoteAddress || null;
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        metadata: metadata !== undefined ? (metadata as Prisma.InputJsonValue) : Prisma.DbNull,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
