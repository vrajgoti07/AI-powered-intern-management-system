import { Request, Response } from 'express';
import leaveRequestService from '../services/leaveRequest.service';
import { successResponse } from '../utils/response';
import { getSocketIO } from '../socket/socket';

export class LeaveRequestController {
  /**
   * Request Leave (Intern)
   */
  async requestLeave(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const record = await leaveRequestService.requestLeave(userId, req.body);

      // Emit Socket notification
      try {
        const io = getSocketIO();
        if (io) {
          io.emit('leave_update', {
            type: 'NEW_REQUEST',
            leaveRequestId: record.id,
            internName: req.user.name,
            leaveType: record.leaveType,
          });
          io.to('admin').emit('leave:new', {
            leaveRequestId: record.id,
            internName: req.user.name,
            leaveType: record.leaveType,
          });
          // Also to dept head if known
          const userDeptId = req.user.departmentId;
          if (userDeptId) {
             io.to(`dept:${userDeptId}`).emit('leave:new', {
               leaveRequestId: record.id,
               internName: req.user.name,
             });
          }
        }
      } catch (ioErr) {
        console.error("Socket emit failed", ioErr);
      }

      successResponse(res, 'Leave request submitted successfully!', record, 201);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Leave submission failed',
      });
    }
  }

  /**
   * Mentor approves (Pending HR)
   */
  async mentorApprove(req: Request, res: Response): Promise<void> {
    try {
      const mentorUserId = req.user?.id;
      const { id } = req.body; // Leave Request ID

      const record = await leaveRequestService.mentorApprove(id, mentorUserId);

      // Emit Socket update
      try {
        const io = (req.app as any).get('io');
        if (io) {
          io.emit('leave_update', {
            type: 'MENTOR_APPROVED',
            leaveRequestId: id,
          });
        }
      } catch (ioErr) {
        console.error("Socket emit failed", ioErr);
      }

      successResponse(res, 'Approved by Supervisor. Forwarded to HR Admin.', record);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Supervisor approval failed',
      });
    }
  }

  /**
   * HR final authorization (Approved)
   */
  async hrApprove(req: Request, res: Response): Promise<void> {
    try {
      const hrUserId = req.user?.id;
      const { id } = req.body;

      const record = await leaveRequestService.hrApprove(id, hrUserId);

      // Emit Socket update
      try {
        const io = getSocketIO();
        if (io) {
          io.emit('leave_update', {
            type: 'HR_APPROVED',
            leaveRequestId: id,
            status: 'Approved',
          });
          io.to(`user:${record.userId}`).emit('leave:decision', {
            leaveRequestId: id,
            status: 'Approved'
          });
        }
      } catch (ioErr) {
        console.error("Socket emit failed", ioErr);
      }

      successResponse(res, 'Absence request fully authorized and auto-attendance synchronized!', record);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'HR authorization failed',
      });
    }
  }

  /**
   * Reject request
   */
  async rejectLeave(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id || req.body.id;
      const reason = req.body.reason || req.body.rejectionReason;
      const rejectedByUserId = req.user?.id;

      const record = await leaveRequestService.rejectLeave(id, rejectedByUserId, reason);

      // Emit Socket update
      try {
        const io = getSocketIO();
        if (io) {
          io.emit('leave_update', {
            type: 'REJECTED',
            leaveRequestId: id,
            reason,
          });
          io.to(`user:${record.userId}`).emit('leave:decision', {
            leaveRequestId: id,
            status: 'Rejected',
            reason
          });
        }
      } catch (ioErr) {
        console.error("Socket emit failed", ioErr);
      }

      successResponse(res, 'Absence request denied successfully', record);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Rejection failed',
      });
    }
  }

  /**
   * Apply Leave (Legacy Compatibility for /leave/apply)
   */
  async applyLeave(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { type, startDate, endDate, reason } = req.body;
      
      const record = await leaveRequestService.requestLeave(userId, {
        leaveType: type || 'Casual Leave',
        reason,
        startDate,
        endDate
      });

      // Emit Socket notification
      try {
        const io = (req.app as any).get('io');
        if (io) {
          io.emit('leave_update', {
            type: 'NEW_REQUEST',
            leaveRequestId: record.id,
            internName: req.user.name,
            leaveType: record.leaveType,
          });
        }
      } catch (ioErr) {
        console.error("Socket emit failed", ioErr);
      }

      successResponse(res, 'Leave request submitted successfully!', record, 201);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Leave submission failed',
      });
    }
  }

  /**
   * Approve Leave (Legacy Compatibility for /leave/:id/approve)
   */
  async approveLeave(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id || req.body.id;
      const userId = req.user?.id;
      const role = req.user?.role;

      let record;
      let typeStr = 'MENTOR_APPROVED';

      if (role === 'HR') {
        record = await leaveRequestService.hrApprove(id, userId);
        typeStr = 'HR_APPROVED';
      } else if (role === 'MENTOR') {
        record = await leaveRequestService.mentorApprove(id, userId);
        typeStr = 'MENTOR_APPROVED';
      } else {
        res.status(403).json({
          success: false,
          message: 'Only mentors or HR admins can approve leave requests',
        });
        return;
      }

      // Emit Socket update
      try {
        const io = (req.app as any).get('io');
        if (io) {
          io.emit('leave_update', {
            type: typeStr,
            leaveRequestId: id,
            status: record.status,
          });
        }
      } catch (ioErr) {
        console.error("Socket emit failed", ioErr);
      }

      successResponse(res, 'Leave request approved successfully', record);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Approval failed',
      });
    }
  }

  /**
   * List all leave requests
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { userId, status, departmentId } = req.query;
      const filters: any = {};

      if (userId) filters.userId = userId as string;
      if (status) filters.status = status as string;
      if (departmentId) filters.departmentId = departmentId as string;

      // Mentor access filtering
      if (req.user?.role === 'MENTOR') {
        filters.mentorId = req.user.mentor?.id;
      } else if (req.user?.role === 'INTERN') {
        filters.userId = req.user.id;
      } else if (req.user?.role === 'DEPARTMENT_HEAD') {
        if (req.user.headedDepartment?.id) {
          filters.departmentId = req.user.headedDepartment.id;
        }
      }

      const records = await leaveRequestService.getLeaveRequests(filters);
      successResponse(res, 'Leave requests list loaded successfully', records);
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to fetch leave requests',
      });
    }
  }

  /**
   * Get Leave Balance
   */
  async getLeaveBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      // Hardcoded yearly allowances
      const allowances = { 'Sick Leave': 10, 'Casual Leave': 5, 'Earned Leave': 15 };
      
      // Calculate taken leaves
      const approvedLeaves = await (require('../config/database').default).leave.findMany({
        where: { userId, status: 'APPROVED' }
      });

      const balances = { ...allowances };
      
      approvedLeaves.forEach((leave: any) => {
        const type = leave.leaveType as keyof typeof allowances;
        if (balances[type] !== undefined) {
          const days = Math.floor((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24)) + 1;
          balances[type] -= days;
        }
      });

      successResponse(res, 'Leave balance calculated successfully', balances);
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Failed to fetch balance' });
    }
  }
}

export default new LeaveRequestController();
