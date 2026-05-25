import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import prisma from '../config/database';
import { successResponse } from '../utils/response';
import { AppError } from '../middleware/error.middleware';

const router = Router();

/**
 * @route   PATCH /api/admin/restore/:model/:id
 * @desc    Restore soft deleted record
 * @access  Admin, Super Admin, HR
 */
router.patch(
  '/restore/:model/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'HR'),
  async (req, res, next) => {
    try {
      const model = req.params.model as string;
      const id = req.params.id as string;
      const lowerModel = model.toLowerCase();

      const allowedModels = ['user', 'intern', 'department', 'task'];
      if (!allowedModels.includes(lowerModel)) {
        throw new AppError(
          `Invalid model: ${model}. Allowed models are: user, intern, department, task`,
          400
        );
      }

      let prismaModel: any;
      if (lowerModel === 'user') prismaModel = prisma.user;
      else if (lowerModel === 'intern') prismaModel = prisma.intern;
      else if (lowerModel === 'department') prismaModel = prisma.department;
      else if (lowerModel === 'task') prismaModel = prisma.task;

      // Check if the record exists (using findUnique since it bypasses findFirst/findMany middleware checks)
      const record = await prismaModel.findUnique({
        where: { id },
      });

      if (!record) {
        throw new AppError(`${model} with ID ${id} not found`, 404);
      }

      // Update deletedAt to null
      const updatedRecord = await prismaModel.update({
        where: { id },
        data: { deletedAt: null },
      });

      // Cascading restore: If restoring an Intern, also restore their User record if it was soft-deleted
      if (lowerModel === 'intern' && record.userId) {
        const userRecord = await prisma.user.findUnique({
          where: { id: record.userId },
        });
        if (userRecord && userRecord.deletedAt !== null) {
          await prisma.user.update({
            where: { id: record.userId },
            data: { deletedAt: null },
          });
        }
      }

      // Cascading restore: If restoring a User that has an Intern role, also restore their Intern record if it was soft-deleted
      if (lowerModel === 'user') {
        const internRecord = await prisma.intern.findUnique({
          where: { userId: id },
        });
        if (internRecord && internRecord.deletedAt !== null) {
          await prisma.intern.update({
            where: { id: internRecord.id },
            data: { deletedAt: null },
          });
        }
      }

      successResponse(res, `${model} restored successfully`, updatedRecord);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
