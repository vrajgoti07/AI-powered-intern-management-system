import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import prisma from '../config/database';
import { successResponse } from '../utils/response';
import { paginate } from '../utils/paginate';

const router = Router();

router.get(
  '/',
  authenticate,
  authorize('HR', 'SUPER_ADMIN'),
  async (req, res, next) => {
    try {
      const { userId, action, startDate, endDate, page = '1', limit = '20' } = req.query;

      const where: any = {};

      if (userId) {
        where.userId = userId as string;
      }

      if (action) {
        where.action = action as string;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          where.createdAt.lte = end;
        }
      }

      const result = await paginate({
        page: page as string,
        limit: limit as string,
        where,
        orderBy: {
          createdAt: 'desc',
        },
        prismaModel: prisma.auditLog
      });

      successResponse(res, 'Audit logs retrieved successfully', {
        logs: result.data,
        pagination: {
          page: result.currentPage,
          limit: Number(limit),
          total: result.totalCount,
          totalPages: result.totalPages,
          hasNext: result.currentPage < result.totalPages,
          hasPrev: result.currentPage > 1,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
