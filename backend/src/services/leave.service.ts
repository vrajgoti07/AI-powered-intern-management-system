import { PrismaClient, LeaveStatus, LeaveType } from '@prisma/client';
import { PaginationQuery, PaginatedResponse } from '../types';
import { normalizeToUtcMidnight } from '../utils/date';

const prisma = new PrismaClient();

interface ApplyLeaveData {
  internId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  reason: string;
}

interface LeaveFilterOptions {
  internId?: string;
  status?: LeaveStatus;
  startDate?: Date;
  endDate?: Date;
}

export class LeaveService {
  /**
   * Apply for leave
   */
  async applyLeave(data: ApplyLeaveData) {
    // Check for overlapping leaves
    const overlappingLeave = await prisma.leave.findFirst({
      where: {
        internId: data.internId,
        status: {
          in: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
        },
        OR: [
          {
            AND: [
              { startDate: { lte: data.startDate } },
              { endDate: { gte: data.startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: data.endDate } },
              { endDate: { gte: data.endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: data.startDate } },
              { endDate: { lte: data.endDate } },
            ],
          },
        ],
      },
    });

    if (overlappingLeave) {
      throw new Error('You already have a leave request for overlapping dates');
    }

    // Create leave request
    const leave = await prisma.leave.create({
      data: {
        internId: data.internId,
        type: data.type,
        startDate: normalizeToUtcMidnight(data.startDate),
        endDate: normalizeToUtcMidnight(data.endDate),
        reason: data.reason,
      },
    });

    return leave;
  }

  /**
   * Get leaves with filters and pagination
   */
  async getLeaves(
    filters: LeaveFilterOptions,
    pagination: PaginationQuery
  ): Promise<PaginatedResponse<any>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.internId) {
      where.internId = filters.internId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) {
        where.startDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startDate.lte = filters.endDate;
      }
    }

    // Get total count
    const total = await prisma.leave.count({ where });

    // Get leaves
    const leaves = await prisma.leave.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        intern: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            mentor: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return {
      data: leaves,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get leave by ID
   */
  async getLeaveById(leaveId: string) {
    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
    });

    return leave;
  }

  /**
   * Approve leave
   */
  async approveLeave(leaveId: string, approvedBy: string) {
    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new Error('Leave request has already been processed');
    }

    // Update leave status
    const updatedLeave = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: LeaveStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Mark attendance as LEAVE for the leave period
    const startDate = new Date(leave.startDate);
    const endDate = new Date(leave.endDate);

    const dates: Date[] = [];
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const currentDate = normalizeToUtcMidnight(date);
      dates.push(currentDate);
    }

    // Create or update attendance records for leave days
    for (const date of dates) {
      await prisma.attendance.upsert({
        where: {
          internId_date: {
            internId: leave.internId,
            date,
          },
        },
        update: {
          status: 'LEAVE',
          notes: `Approved leave: ${leave.type}`,
        },
        create: {
          internId: leave.internId,
          date,
          status: 'LEAVE',
          notes: `Approved leave: ${leave.type}`,
        },
      });
    }

    return updatedLeave;
  }

  /**
   * Reject leave
   */
  async rejectLeave(leaveId: string, approvedBy: string, rejectionReason: string) {
    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new Error('Leave request has already been processed');
    }

    // Update leave status
    const updatedLeave = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        status: LeaveStatus.REJECTED,
        approvedBy,
        approvedAt: new Date(),
        rejectionReason,
      },
    });

    return updatedLeave;
  }

  /**
   * Cancel leave (by intern)
   */
  async cancelLeave(leaveId: string, internId: string) {
    const leave = await prisma.leave.findUnique({
      where: { id: leaveId },
    });

    if (!leave) {
      throw new Error('Leave request not found');
    }

    if (leave.internId !== internId) {
      throw new Error('Unauthorized to cancel this leave request');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new Error('Only pending leave requests can be cancelled');
    }

    // Delete the leave request
    await prisma.leave.delete({
      where: { id: leaveId },
    });

    return { message: 'Leave request cancelled successfully' };
  }

  /**
   * Get leave history for an intern
   */
  async getLeaveHistory(internId: string) {
    const leaves = await prisma.leave.findMany({
      where: { internId },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate leave statistics
    const totalLeaves = leaves.length;
    const approvedLeaves = leaves.filter((l) => l.status === LeaveStatus.APPROVED).length;
    const pendingLeaves = leaves.filter((l) => l.status === LeaveStatus.PENDING).length;
    const rejectedLeaves = leaves.filter((l) => l.status === LeaveStatus.REJECTED).length;

    // Calculate total leave days
    const totalLeaveDays = leaves
      .filter((l) => l.status === LeaveStatus.APPROVED)
      .reduce((sum, leave) => {
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }, 0);

    return {
      leaves,
      statistics: {
        totalLeaves,
        approvedLeaves,
        pendingLeaves,
        rejectedLeaves,
        totalLeaveDays,
      },
    };
  }

  /**
   * Get leave analytics
   */
  async getLeaveAnalytics(filters: { internId?: string; departmentId?: string; startDate?: Date; endDate?: Date }) {
    const where: any = {};

    if (filters.internId) {
      where.internId = filters.internId;
    }

    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) {
        where.startDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startDate.lte = filters.endDate;
      }
    }

    // Get leave counts by status
    const leavesByStatus = await prisma.leave.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });

    // Get leave counts by type
    const leavesByType = await prisma.leave.groupBy({
      by: ['type'],
      where,
      _count: {
        id: true,
      },
    });

    // Get total leaves
    const totalLeaves = await prisma.leave.count({ where });

    return {
      leavesByStatus: leavesByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
      leavesByType: leavesByType.map((item) => ({
        type: item.type,
        count: item._count.id,
      })),
      totalLeaves,
    };
  }
}

export default new LeaveService();
