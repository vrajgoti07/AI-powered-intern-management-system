import prisma from '../config/database';
import { logger } from '../utils/logger';
const archiver = require('archiver') as any;
import * as fs from 'fs';
import * as path from 'path';

// Ensure the exports directory exists
const EXPORTS_DIR = path.join(process.cwd(), 'uploads', 'exports');
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

export class DataExportService {
  /**
   * Request a data export
   */
  async requestExport(userId: string, organizationId: string) {
    const request = await prisma.dataExportRequest.create({
      data: {
        userId,
        organizationId,
        status: 'PENDING',
        requestType: 'EXPORT',
      },
    });

    // Start background processing
    this.processExport(request.id, userId).catch(err => {
      logger.error(`GDPR data export job ${request.id} failed: ${err.message}`);
    });

    return request;
  }

  /**
   * Process and package user PII into a ZIP file
   */
  async processExport(requestId: string, userId: string) {
    logger.info(`Processing GDPR data export request ${requestId} for user ${userId}...`);

    try {
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'PROCESSING' },
      });

      // 1. Gather all tables containing PII for this user
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          intern: {
            include: {
              tasks: true,
              attendances: true,
              leaves: true,
              dailyStandups: true,
              goals: true,
            },
          },
          mentor: {
            include: {
              tasks: true,
              feedbacks: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Compile data packages
      const exportData: Record<string, any> = {
        profile: {
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl,
          createdAt: user.createdAt,
        },
      };

      if (user.intern) {
        exportData.internProfile = {
          phone: user.intern.phone,
          dob: user.intern.dob,
          college: user.intern.college,
          degree: user.intern.degree,
          branch: user.intern.branch,
          cgpa: user.intern.cgpa,
          skills: user.intern.skills,
          startDate: user.intern.startDate,
          joinedDate: user.intern.joinedDate,
        };
        exportData.tasks = user.intern.tasks.map(t => ({
          title: t.title,
          description: t.description,
          status: t.status,
          dueDate: t.dueDate,
          submittedAt: t.submittedAt,
        }));
        exportData.attendance = user.intern.attendances.map(a => ({
          date: a.date,
          status: a.status,
          checkIn: a.checkIn,
          checkOut: a.checkOut,
          workingHours: a.workingHours,
        }));
        exportData.leaves = user.intern.leaves.map(l => ({
          type: l.type,
          startDate: l.startDate,
          endDate: l.endDate,
          reason: l.reason,
          status: l.status,
        }));
        exportData.dailyStandups = user.intern.dailyStandups.map(s => ({
          date: s.date,
          yesterday: s.yesterday,
          today: s.today,
          blockers: s.blockers,
          mood: s.mood,
        }));
        exportData.goals = user.intern.goals.map(g => ({
          title: g.title,
          description: g.description,
          status: g.status,
          weekStartDate: g.weekStartDate,
        }));
      }

      if (user.mentor) {
        exportData.mentorProfile = {
          designation: user.mentor.designation,
          expertise: user.mentor.expertise,
          bio: user.mentor.bio,
          phone: user.mentor.phone,
        };
        exportData.assignedTasks = user.mentor.tasks.map(t => ({
          title: t.title,
          status: t.status,
          dueDate: t.dueDate,
        }));
        exportData.submittedFeedbacks = user.mentor.feedbacks.map(f => ({
          rating: f.rating,
          comment: f.comment,
          sentiment: f.sentiment,
        }));
      }

      // 2. Compress JSON files into a ZIP archive
      const zipFileName = `${requestId}.zip`;
      const zipFilePath = path.join(EXPORTS_DIR, zipFileName);
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      // Listen for archive finalization
      const archivePromise = new Promise<void>((resolvePromise, rejectPromise) => {
        output.on('close', () => resolvePromise());
        archive.on('error', (err: any) => rejectPromise(err));
      });

      archive.pipe(output);

      // Append compiled parts as JSON strings
      Object.entries(exportData).forEach(([key, val]) => {
        archive.append(JSON.stringify(val, null, 2), { name: `${key}.json` });
      });

      await archive.finalize();
      await archivePromise;

      // 3. Update export request status
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

      const relativeUrl = `uploads/exports/${zipFileName}`;

      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: {
          status: 'READY',
          fileUrl: relativeUrl,
          processedAt: new Date(),
          expiresAt,
        },
      });

      logger.info(`GDPR data export ${requestId} ready for download.`);

    } catch (err: any) {
      logger.error(`Failed to process GDPR export request ${requestId}: ${err.message}`);
      await prisma.dataExportRequest.update({
        where: { id: requestId },
        data: { status: 'EXPIRED' },
      });
    }
  }

  /**
   * Get user request history
   */
  async getRequestHistory(userId: string) {
    return prisma.dataExportRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new DataExportService();
