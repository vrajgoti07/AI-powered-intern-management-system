import prisma from '../config/database';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { emailQueue } from '../queues/queue.config';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-gdpr-secret-key-1234';

export class ErasureService {
  /**
   * Request erasure: creates record and sends confirmation email
   */
  async requestErasure(userId: string, reason: string | undefined, organizationId: string) {
    const request = await prisma.erasureRequest.create({
      data: {
        userId,
        organizationId,
        status: 'PENDING',
        reason,
      },
    });

    // Generate confirmation token valid for 24 hours
    const token = jwt.sign(
      { requestId: request.id, userId, type: 'ERASURE_CONFIRMATION' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send confirmation email to the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/gdpr/confirm-erasure?token=${token}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #ef4444; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Confirm Right to Erasure (Account Deletion)</h2>
          <p style="font-size: 16px; color: #334155;">Hello ${user.name},</p>
          <p style="font-size: 14px; color: #475569;">
            We received a request to permanently delete your InternFlow account and anonymize your records. 
            Before we can forward this request to your HR administrators for final compliance approval, you must verify your identity by confirming this request.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${confirmUrl}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Confirm Erasure Request
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">
            This link is valid for 24 hours. If you did not make this request, you can safely ignore this email and your account will remain active.
          </p>
        </div>
      `;

      await emailQueue.add('send_email', {
        to: user.email,
        subject: 'Action Required: Confirm Right to Erasure Deletion Request',
        html: emailHtml,
      });
    }

    return request;
  }

  /**
   * User confirms erasure request using token
   */
  async confirmErasure(token: string) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded.type !== 'ERASURE_CONFIRMATION') {
        throw new Error('Invalid token type');
      }

      const request = await prisma.erasureRequest.findUnique({
        where: { id: decoded.requestId },
      });

      if (!request || request.status !== 'PENDING') {
        throw new Error('Request already processed or invalid');
      }

      const updated = await prisma.erasureRequest.update({
        where: { id: request.id },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      logger.info(`GDPR erasure request ${request.id} confirmed by user ${decoded.userId}`);
      return updated;
    } catch (err: any) {
      logger.error(`Erasure confirmation failed: ${err.message}`);
      throw new Error(`Invalid or expired verification token: ${err.message}`);
    }
  }

  /**
   * HR views confirmed erasure requests
   */
  async getConfirmedRequests(organizationId: string) {
    return prisma.erasureRequest.findMany({
      where: {
        organizationId,
        status: { in: ['CONFIRMED', 'PENDING'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * HR approves erasure: triggers transactional database anonymization
   */
  async approveErasure(requestId: string, hrUserId: string, organizationId: string) {
    logger.info(`HR ${hrUserId} approving erasure request ${requestId}`);

    const request = await prisma.erasureRequest.findUnique({
      where: { id: requestId, organizationId },
    });

    if (!request || request.status !== 'CONFIRMED') {
      throw new Error('Request not found or not in CONFIRMED state');
    }

    const targetUserId = request.userId;

    // Execute anonymization transaction
    await prisma.$transaction(async (tx) => {
      // 1. Get user details
      const user = await tx.user.findUnique({
        where: { id: targetUserId },
        include: { intern: true, mentor: true },
      });

      if (!user) {
        throw new Error('User to erase not found');
      }

      // Generate anonymous tags
      const anonSlug = crypto.randomBytes(6).toString('hex');
      const anonEmail = `anonymous-${anonSlug}@internflow.com`;
      const anonPasswordHash = await crypto.randomBytes(16).toString('hex'); // Scramble password

      // 2. Anonymize core User model
      await tx.user.update({
        where: { id: targetUserId },
        data: {
          name: `Anonymous User (${anonSlug})`,
          email: anonEmail,
          password: anonPasswordHash,
          avatarUrl: null,
          username: `anonymous_${anonSlug}`,
          isActive: false,
          isEmailVerified: false,
          refreshToken: null,
          totpSecret: null,
          totpEnabled: false,
        },
      });

      // 3. Anonymize Intern details
      if (user.intern) {
        await tx.intern.update({
          where: { id: user.intern.id },
          data: {
            phone: null,
            dob: null,
            college: 'Erased College (GDPR)',
            degree: null,
            branch: null,
            emergencyName: null,
            emergencyRelation: null,
            emergencyPhone: null,
            address: null,
            workAddress: null,
            githubUrl: null,
            linkedinUrl: null,
            parentName: null,
            parentPhone: null,
            idProofUrl: null,
            marksheetUrl: null,
            aadhaarPanUrl: null,
            collegeIdUrl: null,
            passportPhotoUrl: null,
          },
        });

        // 4. Scrub file details but keep the task completed metrics
        await tx.taskFile.updateMany({
          where: { uploadedBy: targetUserId },
          data: {
            fileName: 'erased_file.bin',
            fileUrl: 'https://internflow.com/erased',
            extractedText: null,
          },
        });
      }

      // 5. Anonymize Mentor details
      if (user.mentor) {
        await tx.mentor.update({
          where: { id: user.mentor.id },
          data: {
            phone: null,
            bio: 'Erased profile details per GDPR right to erasure request.',
            designation: 'Erased Mentor',
          },
        });
      }

      // 6. Hard delete sessions and tokens to instantly terminate any active user connections
      await tx.userSession.deleteMany({ where: { userId: targetUserId } });
      await tx.loginActivity.deleteMany({ where: { userId: targetUserId } });
      await tx.trustedSession.deleteMany({ where: { userId: targetUserId } });
      await tx.otpVerification.deleteMany({ where: { userId: targetUserId } });

      // 7. Update the ErasureRequest record
      await tx.erasureRequest.update({
        where: { id: requestId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          processedBy: hrUserId,
        },
      });
    });

    logger.info(`GDPR right to erasure successfully completed for user ${targetUserId}`);
    return { success: true };
  }

  /**
   * HR rejects erasure request
   */
  async rejectErasure(requestId: string, hrUserId: string, organizationId: string) {
    const request = await prisma.erasureRequest.findUnique({
      where: { id: requestId, organizationId },
    });

    if (!request || request.status !== 'CONFIRMED') {
      throw new Error('Request not found or not in CONFIRMED state');
    }

    return prisma.erasureRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        processedAt: new Date(),
        processedBy: hrUserId,
      },
    });
  }
}

export default new ErasureService();
