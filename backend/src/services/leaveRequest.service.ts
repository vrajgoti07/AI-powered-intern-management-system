import { PrismaClient } from '@prisma/client';
import attendanceService from './attendance.service';
import { normalizeToUtcMidnight } from '../utils/date';

const prisma = new PrismaClient();

export class LeaveRequestService {
  /**
   * Intern requests a new absence leave
   */
  async requestLeave(userId: string, data: { leaveType: string; reason: string; startDate: string; endDate: string }) {
    const intern = await prisma.intern.findUnique({
      where: { userId },
    });

    if (!intern || intern.status !== 'ACTIVE') {
      throw new Error('Only active approved interns can apply for leaves');
    }

    const startDate = normalizeToUtcMidnight(data.startDate);
    const endDate = normalizeToUtcMidnight(data.endDate);

    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date');
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId,
        mentorId: intern.mentorId,
        leaveType: data.leaveType,
        reason: data.reason,
        startDate,
        endDate,
        status: 'Pending Mentor',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Notify mentor or HR via notifications table
    if (intern.mentorId) {
      const mentor = await prisma.mentor.findUnique({
        where: { id: intern.mentorId },
      });
      if (mentor) {
        await prisma.notification.create({
          data: {
            userId: mentor.userId,
            title: 'New Leave Request',
            message: `${leaveRequest.user.name} requested leave: ${data.leaveType} from ${data.startDate} to ${data.endDate}`,
            type: 'LEAVE',
            data: { leaveRequestId: leaveRequest.id },
          },
        });
      }
    }

    return leaveRequest;
  }

  /**
   * Mentor approves the leave request (moves to Pending HR)
   */
  async mentorApprove(leaveRequestId: string, mentorUserId: string) {
    const mentor = await prisma.mentor.findUnique({
      where: { userId: mentorUserId },
    });

    if (!mentor) {
      throw new Error('Only registered supervisors can approve leave requests');
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        user: {
          include: {
            intern: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if (leaveRequest.status !== 'Pending Mentor') {
      throw new Error('Leave request is not pending mentor review');
    }

    // Update status
    const updated = await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: 'Pending HR',
        mentorId: mentor.id,
      },
    });

    // Notify HR Admins
    const hrUsers = await prisma.user.findMany({
      where: { role: 'HR' },
    });

    for (const hr of hrUsers) {
      await prisma.notification.create({
        data: {
          userId: hr.id,
          title: 'Leave Request (Supervisor Approved)',
          message: `${leaveRequest.user.name}'s leave request approved by mentor. Requires HR authorization.`,
          type: 'LEAVE',
          data: { leaveRequestId: leaveRequest.id },
        },
      });
    }

    return updated;
  }

  /**
   * HR finalizes leave approval and auto-updates attendance records
   */
  async hrApprove(leaveRequestId: string, hrUserId: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        user: {
          include: {
            intern: true,
          },
        },
      },
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    if (leaveRequest.status !== 'Pending HR' && leaveRequest.status !== 'Pending Mentor') {
      throw new Error('Leave request has already been finalized or rejected');
    }

    const intern = leaveRequest.user.intern;
    if (!intern) {
      throw new Error('Intern profile not resolved for this request');
    }

    // Update leave request to Approved
    const updated = await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: 'Approved',
        hrId: hrUserId,
      },
    });

    // Auto-mark attendance as ON_LEAVE for all days in interval
    const startDate = normalizeToUtcMidnight(leaveRequest.startDate);
    const endDate = normalizeToUtcMidnight(leaveRequest.endDate);
    
    const dates: Date[] = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      dates.push(normalizeToUtcMidnight(current));
      current.setDate(current.getDate() + 1);
    }

    for (const d of dates) {
      await prisma.attendance.upsert({
        where: {
          internId_date: {
            internId: intern.id,
            date: d,
          },
        },
        update: {
          status: 'ON_LEAVE',
          notes: `Approved Leave: ${leaveRequest.leaveType}`,
          markedBy: 'SYSTEM',
        },
        create: {
          internId: intern.id,
          date: d,
          status: 'ON_LEAVE',
          notes: `Approved Leave: ${leaveRequest.leaveType}`,
          markedBy: 'SYSTEM',
        },
      });
    }

    // Recalculate attendance stats
    await attendanceService.recalculateAttendancePercentage(intern.id);

    // Notify Intern
    await prisma.notification.create({
      data: {
        userId: leaveRequest.userId,
        title: 'Absence Leave Authorized',
        message: `Your requested time-off from ${leaveRequest.startDate.toISOString().split('T')[0]} to ${leaveRequest.endDate.toISOString().split('T')[0]} has been fully authorized by HR.`,
        type: 'LEAVE',
        data: { leaveRequestId: leaveRequest.id },
      },
    });

    return updated;
  }

  /**
   * Approve or reject leave request
   */
  async rejectLeave(leaveRequestId: string, _rejectedByUserId: string, reason?: string) {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
    });

    if (!leaveRequest) {
      throw new Error('Leave request not found');
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: 'Rejected',
        reason: reason ? `Rejected: ${reason}` : 'Rejected by supervisor',
      },
    });

    // Notify Intern
    await prisma.notification.create({
      data: {
        userId: leaveRequest.userId,
        title: 'Absence Leave Denied',
        message: `Your requested time-off request was denied by supervisor. Reason: ${reason || 'Not specified.'}`,
        type: 'LEAVE',
        data: { leaveRequestId: leaveRequest.id },
      },
    });

    return updated;
  }

  /**
   * List all leave requests
   */
  async getLeaveRequests(filters: { userId?: string; status?: string; mentorId?: string }) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.status) where.status = filters.status;
    if (filters.mentorId) where.mentorId = filters.mentorId;

    return prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            intern: {
              select: {
                id: true,
                department: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default new LeaveRequestService();
