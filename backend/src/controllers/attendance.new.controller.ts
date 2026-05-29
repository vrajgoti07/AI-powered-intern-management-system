import { Request, Response } from 'express';
import attendanceService from '../services/attendance.service';
import redis from '../config/redis';
import holidayService from '../services/holiday.service';
import { successResponse } from '../utils/response';
import prisma from '../config/database';
import { getSocketIO } from '../socket/socket';

export class AttendanceNewController {
  /**
   * Check-in today
   */
  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const internId = req.user?.intern?.id;
      if (!internId) {
        res.status(403).json({
          success: false,
          message: 'Only active interns can mark check-in attendance',
        });
        return;
      }

      const { notes } = req.body;
      const deviceInfo = req.headers['user-agent'] || 'Unknown Browser';
      const ipAddress = req.ip || '127.0.0.1';

      const record = await attendanceService.checkIn(internId, notes, deviceInfo, ipAddress);
      redis.keys('cache:/api/attendance/analytics*').then(keys => { if (keys.length > 0) redis.del(keys); }).catch(err => console.error('Redis cache clear failed:', err));

      // Emit Socket event for real-time dashboard notifications
      try {
        const io = getSocketIO();
        if (io) {
          io.emit('attendance_update', {
            type: 'CHECK_IN',
            internId,
            name: req.user.name,
            status: record.status,
            date: record.date,
          });
          io.to(`user:${req.user!.id}`).emit('attendance:marked', {
            date: record.date,
            status: record.status
          });
        }
      } catch (ioErr) {
        console.error("Socket emit failed", ioErr);
      }

      successResponse(res, 'Checked in successfully today!', record, 200);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Check-in failed',
      });
    }
  }

  /**
   * Check-out today
   */
  async checkOut(req: Request, res: Response): Promise<void> {
    try {
      const internId = req.user?.intern?.id;
      if (!internId) {
        res.status(403).json({
          success: false,
          message: 'Only active interns can mark check-out attendance',
        });
        return;
      }

      const { notes } = req.body;
      const record = await attendanceService.checkOut(internId, notes);

      // Emit Socket event for real-time dashboards
      try {
        const io = getSocketIO();
        if (io) {
          io.emit('attendance_update', {
            type: 'CHECK_OUT',
            internId,
            name: req.user.name,
            workingHours: record.workingHours,
            status: record.status,
            date: record.date,
          });
          io.to(`user:${req.user!.id}`).emit('attendance:marked', {
            date: record.date,
            status: record.status
          });
        }
      } catch (ioErr) {
        console.error("Socket emit failed", ioErr);
      }

      successResponse(res, 'Checked out successfully today!', record, 200);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Check-out failed',
      });
    }
  }

  /**
   * Get own attendance records & analytics (Intern)
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const internId = req.user?.intern?.id;
      if (!internId) {
        res.status(403).json({
          success: false,
          message: 'Only registered interns have check-in history logs',
        });
        return;
      }

      const records = await attendanceService.getAttendance({ internId });
      const analytics = await attendanceService.getAttendanceAnalytics({ internId });

      successResponse(res, 'Attendance profile logs loaded successfully', {
        records,
        analytics,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch personal logs',
      });
    }
  }

  /**
   * Get assigned interns' records (Mentor)
   */
  async getTeam(req: Request, res: Response): Promise<void> {
    try {
      const mentorId = req.user?.mentor?.id;
      if (!mentorId) {
        res.status(403).json({
          success: false,
          message: 'Only supervisors can query assigned intern teams',
        });
        return;
      }

      // Fetch all assigned interns
      const interns = await prisma.intern.findMany({
        where: { mentorId },
        select: { id: true, userId: true },
      });

      const internIds = interns.map(i => i.id);

      const records = await prisma.attendance.findMany({
        where: {
          internId: { in: internIds },
        },
        orderBy: { date: 'desc' },
      });

      successResponse(res, 'Assigned team logs fetched successfully', records);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch team records',
      });
    }
  }

  /**
   * Get all records (HR Admin)
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { internId, status, startDate, endDate } = req.query;
      const filters: any = {};

      if (internId) filters.internId = internId as string;
      if (status) filters.status = status as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const records = await prisma.attendance.findMany({
        where: {
          internId: filters.internId,
          status: filters.status,
          date: filters.startDate || filters.endDate ? {
            gte: filters.startDate,
            lte: filters.endDate,
          } : undefined,
        },
        include: {
          intern: {
            include: {
              user: {
                select: { name: true, email: true },
              },
              department: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
      });

      successResponse(res, 'All database attendance records loaded', records);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch records',
      });
    }
  }

  /**
   * Override attendance (HR manual update)
   */
  async override(req: Request, res: Response): Promise<void> {
    try {
      const { internId, date, status, notes } = req.body;
      const overrideUser = req.user?.name || "HR Admin";

      const record = await attendanceService.markAttendance(
        internId,
        new Date(date),
        status,
        notes,
        overrideUser
      );

      // Emit socket update
      try {
        const io = getSocketIO();
        if (io) {
          io.emit('attendance_update', {
            type: 'OVERRIDE',
            internId,
            status,
            date: record.date,
          });
          const internRecord = await prisma.intern.findUnique({ where: { id: internId }, select: { userId: true } });
          if (internRecord?.userId) {
            io.to(`user:${internRecord.userId}`).emit('attendance:marked', {
              date: record.date,
              status: record.status
            });
          }
        }
      } catch (ioErr) {
        console.error("Socket emit failed", ioErr);
      }

      successResponse(res, 'Manual attendance override saved successfully', record);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Override failed',
      });
    }
  }

  /**
   * Get today's check-in status
   */
  async getTodayAttendance(req: Request, res: Response): Promise<void> {
    try {
      const internId = req.user?.intern?.id;
      if (!internId) {
        res.status(403).json({
          success: false,
          message: 'Only active interns can query check-in status',
        });
        return;
      }

      const record = await attendanceService.getTodayAttendance(internId);
      successResponse(res, "Today's check-in record loaded successfully", record);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch status',
      });
    }
  }

  /**
   * Get attendance analytics
   */
  async getAttendanceAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { internId, departmentId, startDate, endDate } = req.query;
      const filters: any = {};

      if (req.user?.role === 'INTERN') {
        filters.internId = req.user.intern?.id;
      } else if (req.user?.role === 'DEPARTMENT_HEAD') {
        filters.departmentId = departmentId ? (departmentId as string) : (req.user.headedDepartment?.id || undefined);
        if (internId) filters.internId = internId as string;
      } else {
        if (internId) filters.internId = internId as string;
        if (departmentId) filters.departmentId = departmentId as string;
      }

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const analytics = await attendanceService.getAttendanceAnalytics(filters);
      successResponse(res, 'Analytics aggregated successfully', analytics);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Analytics aggregation failed',
      });
    }
  }

  /**
   * Get Settings
   */
  async getSettings(_req: Request, res: Response): Promise<void> {
    try {
      const settings = await attendanceService.getSettings();
      successResponse(res, 'Attendance settings loaded', settings);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Update Settings (HR only)
   */
  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const record = await attendanceService.updateSettings(req.body);
      successResponse(res, 'Attendance settings updated successfully', record);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Update settings failed' });
    }
  }

  /**
   * Holidays
   */
  async getHolidays(_req: Request, res: Response): Promise<void> {
    try {
      const holidays = await holidayService.getHolidays();
      successResponse(res, 'Holidays loaded', holidays);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async addHoliday(req: Request, res: Response): Promise<void> {
    try {
      const { title, date, type } = req.body;
      const record = await holidayService.addHoliday(title, date, type);
      successResponse(res, 'Holiday registered successfully', record);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Add holiday failed' });
    }
  }

  async removeHoliday(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const record = await holidayService.removeHoliday(id);
      successResponse(res, 'Holiday removed', record);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  /**
   * Root GET /api/v1/attendance
   * Automatically delegates to getMe, getTeam, or getAll based on role
   */
  async getRootAttendance(req: Request, res: Response): Promise<void> {
    try {
      const role = req.user?.role;
      if (role === 'INTERN') {
        const internId = req.user?.intern?.id;
        if (!internId) {
          res.status(403).json({ success: false, message: 'Intern profile not found' });
          return;
        }
        const records = await attendanceService.getAttendance({ internId });
        successResponse(res, 'Personal attendance records loaded', records);
      } else if (role === 'MENTOR') {
        const mentorId = req.user?.mentor?.id;
        if (!mentorId) {
          res.status(403).json({ success: false, message: 'Mentor profile not found' });
          return;
        }
        // Fetch all assigned interns
        const interns = await prisma.intern.findMany({
          where: { mentorId },
          select: { id: true },
        });
        const internIds = interns.map(i => i.id);
        const records = await prisma.attendance.findMany({
          where: { internId: { in: internIds } },
          include: {
            intern: {
              include: {
                user: { select: { name: true, email: true } },
                department: { select: { name: true } },
              }
            }
          },
          orderBy: { date: 'desc' },
        });
        successResponse(res, 'Assigned team attendance records loaded', records);
      } else if (role === 'DEPARTMENT_HEAD') {
        if (!req.user.headedDepartment?.id) {
          res.status(403).json({ success: false, message: 'Headed department not found' });
          return;
        }
        // Fetch all interns in department
        const interns = await prisma.intern.findMany({
          where: { departmentId: req.user.headedDepartment.id },
          select: { id: true },
        });
        const internIds = interns.map(i => i.id);
        const records = await prisma.attendance.findMany({
          where: { internId: { in: internIds } },
          include: {
            intern: {
              include: {
                user: { select: { name: true, email: true } },
                department: { select: { name: true } },
              }
            }
          },
          orderBy: { date: 'desc' },
        });
        successResponse(res, 'Department team attendance records loaded', records);
      } else if (role === 'HR') {
        const records = await prisma.attendance.findMany({
          include: {
            intern: {
              include: {
                user: { select: { name: true, email: true } },
                department: { select: { name: true } },
              }
            }
          },
          orderBy: { date: 'desc' },
        });
        successResponse(res, 'All attendance records loaded', records);
      } else {
        res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to fetch attendance logs' });
    }
  }
}

export default new AttendanceNewController();
