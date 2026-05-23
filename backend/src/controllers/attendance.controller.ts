import { Request, Response, NextFunction } from 'express';
import attendanceService from '../services/attendance.service';
import { successResponse } from '../utils/response';

export class AttendanceController {
  /**
   * Check-in today
   */
  async checkIn(req: Request, res: Response): Promise<void> {
    try {
      const internId = req.user?.intern?.id;
      if (!internId) {
        res.status(403).json({
          success: false,
          message: 'Only active interns can check in',
        });
        return;
      }

      const { notes } = req.body;
      const attendance = await attendanceService.checkIn(internId, notes);

      successResponse(res, 'Checked in successfully', attendance, 200);
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
          message: 'Only active interns can check out',
        });
        return;
      }

      const { notes } = req.body;
      const attendance = await attendanceService.checkOut(internId, notes);

      successResponse(res, 'Checked out successfully', attendance, 200);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Check-out failed',
      });
    }
  }

  /**
   * Get attendance records
   */
  async getAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internId, startDate, endDate, status } = req.query;
      const filters: any = {};

      if (req.user?.role === 'INTERN') {
        filters.internId = req.user.intern?.id;
      } else {
        if (internId) filters.internId = internId as string;
      }

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (status) filters.status = status as string;

      const records = await attendanceService.getAttendance(filters);
      successResponse(res, 'Attendance records retrieved successfully', records);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get today's attendance status
   */
  async getTodayAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const internId = req.user?.intern?.id;
      if (!internId) {
        res.status(403).json({
          success: false,
          message: 'Only active interns have check-in status',
        });
        return;
      }

      const record = await attendanceService.getTodayAttendance(internId);
      successResponse(res, "Today's attendance status retrieved successfully", record);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get attendance analytics
   */
  async getAttendanceAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internId, departmentId, startDate, endDate } = req.query;
      const filters: any = {};

      if (req.user?.role === 'INTERN') {
        filters.internId = req.user.intern?.id;
      } else {
        if (internId) filters.internId = internId as string;
        if (departmentId) filters.departmentId = departmentId as string;
      }

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const analytics = await attendanceService.getAttendanceAnalytics(filters);
      successResponse(res, 'Attendance analytics retrieved successfully', analytics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Manually log/mark attendance (HR/Mentor only)
   */
  async markAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internId, date, status, notes } = req.body;
      const attendance = await attendanceService.markAttendance(
        internId,
        new Date(date),
        status,
        notes
      );

      successResponse(res, 'Attendance marked successfully', attendance);
    } catch (error) {
      next(error);
    }
  }
}

export default new AttendanceController();
