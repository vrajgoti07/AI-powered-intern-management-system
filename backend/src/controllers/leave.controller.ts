import { Request, Response, NextFunction } from 'express';
import leaveService from '../services/leave.service';
import { successResponse } from '../utils/response';
import { LeaveType, LeaveStatus } from '@prisma/client';
import notificationService from '../services/notification.service';
import prisma from '../config/database';
import { emailQueue } from '../queues/queue.config';

export class LeaveController {
  /**
   * Apply for leave
   */
  async applyLeave(req: Request, res: Response): Promise<void> {
    try {
      const internId = req.user?.intern?.id;
      if (!internId) {
        res.status(403).json({
          success: false,
          message: 'Only active interns can apply for leaves',
        });
        return;
      }

      const { type, startDate, endDate, reason } = req.body;
      const leave = await leaveService.applyLeave({
        internId,
        type: type as LeaveType,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      });

      // Notify the intern's mentor if assigned
      const internRecord = await prisma.intern.findUnique({
        where: { id: internId },
        select: { 
          user: { select: { name: true } },
          mentor: { select: { userId: true } } 
        },
      });
      if (internRecord?.mentor?.userId) {
        await notificationService.createNotification(
          internRecord.mentor.userId,
          'New Leave Application',
          `${internRecord.user.name} has applied for a leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
          'LEAVE',
          { leaveId: leave.id },
          true,
          'New Leave Application Submitted'
        );
      }

      // Notify HR administrators
      await notificationService.notifyHR(
        'New Leave Application',
        `${internRecord?.user?.name || req.user?.name || 'An intern'} has applied for a leave from ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}.`,
        'LEAVE',
        { leaveId: leave.id, internId }
      );

      successResponse(res, 'Leave application submitted successfully', leave, 201);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to apply for leave',
      });
    }
  }

  /**
   * Approve leave (HR/Mentor only)
   */
  async approveLeave(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const approvedBy = req.user?.name || req.user?.id || 'System';

      const leave = await leaveService.approveLeave(id as string, approvedBy);

      // Notify the intern about the leave approval
      const internUser = await prisma.intern.findUnique({
        where: { id: leave.internId },
        select: { 
          userId: true,
          user: { select: { name: true, email: true } }
        },
      });
      if (internUser?.userId) {
        await notificationService.createNotification(
          internUser.userId,
          'Leave Approved',
          `Your leave request from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()} has been approved.`,
          'LEAVE',
          { leaveId: leave.id },
          true,
          'Leave Request Approved'
        );

        if (internUser.user?.email) {
          await emailQueue.add('LEAVE_APPROVED', {
            to: internUser.user.email,
            data: {
              name: internUser.user.name,
              leaveType: leave.type,
              startDate: leave.startDate.toISOString().split('T')[0],
              endDate: leave.endDate.toISOString().split('T')[0],
              approvedBy
            }
          });
        }
      }

      // Notify all HR administrators
      const internName = internUser?.user?.name || 'An intern';
      await notificationService.notifyHR(
        'Leave Request Approved',
        `Leave request for ${internName} from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()} has been APPROVED by ${approvedBy}.`,
        'LEAVE',
        { leaveId: leave.id }
      );

      successResponse(res, 'Leave request approved successfully', leave);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to approve leave request',
      });
    }
  }

  /**
   * Reject leave (HR/Mentor only)
   */
  async rejectLeave(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const approvedBy = req.user?.name || req.user?.id || 'System';

      const leave = await leaveService.rejectLeave(
        id as string,
        approvedBy,
        rejectionReason
      );

      // Notify the intern about the leave rejection
      const internUser = await prisma.intern.findUnique({
        where: { id: leave.internId },
        select: { 
          userId: true,
          user: { select: { name: true, email: true } }
        },
      });
      if (internUser?.userId) {
        await notificationService.createNotification(
          internUser.userId,
          'Leave Rejected',
          `Your leave request from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()} has been rejected. Reason: "${rejectionReason || 'No reason provided'}".`,
          'LEAVE',
          { leaveId: leave.id },
          true,
          'Leave Request Update'
        );

        if (internUser.user?.email) {
          await emailQueue.add('LEAVE_REJECTED', {
            to: internUser.user.email,
            data: {
              name: internUser.user.name,
              leaveType: leave.type,
              reason: rejectionReason || 'No reason provided'
            }
          });
        }
      }

      // Notify all HR administrators
      const internName = internUser?.user?.name || 'An intern';
      await notificationService.notifyHR(
        'Leave Request Rejected',
        `Leave request for ${internName} from ${leave.startDate.toLocaleDateString()} to ${leave.endDate.toLocaleDateString()} has been REJECTED by ${approvedBy}. Reason: "${rejectionReason || 'No reason provided'}".`,
        'LEAVE',
        { leaveId: leave.id }
      );

      successResponse(res, 'Leave request rejected successfully', leave);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject leave request',
      });
    }
  }

  /**
   * Get all leaves with filters and pagination
   */
  async getLeaves(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, sortBy, sortOrder, internId, status, startDate, endDate } = req.query;

      const filters: any = {};
      if (req.user?.role === 'INTERN') {
        filters.internId = req.user.intern?.id;
      } else {
        if (internId) filters.internId = internId as string;
      }

      if (status) filters.status = status as LeaveStatus;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const result = await leaveService.getLeaves(filters, {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        sortBy: (sortBy as string) || 'createdAt',
        sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
      });

      res.status(200).json({
        success: true,
        message: 'Leaves retrieved successfully',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get leave request by ID
   */
  async getLeaveById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const leave = await leaveService.getLeaveById(id as string);

      if (!leave) {
        res.status(404).json({
          success: false,
          message: 'Leave request not found',
        });
        return;
      }

      // Check authorization
      if (req.user?.role === 'INTERN' && leave.internId !== req.user.intern?.id) {
        res.status(403).json({
          success: false,
          message: 'Unauthorized to view this leave request',
        });
        return;
      }

      successResponse(res, 'Leave request retrieved successfully', leave);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get leave history and stats for an intern
   */
  async getLeaveHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { internId } = req.query;
      let targetInternId = '';

      if (req.user?.role === 'INTERN') {
        targetInternId = req.user.intern?.id;
      } else {
        if (!internId) {
          res.status(400).json({
            success: false,
            message: 'Intern ID is required',
          });
          return;
        }
        targetInternId = internId as string;
      }

      const history = await leaveService.getLeaveHistory(targetInternId);
      successResponse(res, 'Leave history and statistics retrieved successfully', history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get leave analytics
   */
  async getLeaveAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const analytics = await leaveService.getLeaveAnalytics(filters);
      successResponse(res, 'Leave analytics retrieved successfully', analytics);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel pending leave request
   */
  async cancelLeave(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const internId = req.user?.intern?.id;

      if (!internId) {
        res.status(403).json({
          success: false,
          message: 'Only active interns can cancel leave requests',
        });
        return;
      }

      const result = await leaveService.cancelLeave(id as string, internId);
      successResponse(res, result.message, null);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel leave request',
      });
    }
  }
}

export default new LeaveController();
