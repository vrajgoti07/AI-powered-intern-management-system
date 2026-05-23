import { PrismaClient } from '@prisma/client';
import { normalizeToUtcMidnight } from '../utils/date';

const prisma = new PrismaClient();

export class HolidayService {
  /**
   * Register or update holiday
   */
  async addHoliday(title: string, date: string, type: string) {
    const holidayDate = normalizeToUtcMidnight(date);

    const holiday = await prisma.holiday.upsert({
      where: { date: holidayDate },
      update: { title, type },
      create: { title, date: holidayDate, type },
    });

    // Automatically retroactively mark any active attendance record on this day as 'HOLIDAY'
    await prisma.attendance.updateMany({
      where: { date: holidayDate },
      data: {
        status: 'HOLIDAY',
        notes: `Auto Holiday: ${title}`,
      },
    });

    return holiday;
  }

  /**
   * Delete holiday
   */
  async removeHoliday(id: string) {
    const holiday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!holiday) {
      throw new Error('Holiday record not found');
    }

    await prisma.holiday.delete({
      where: { id },
    });

    return { success: true, message: 'Holiday deleted successfully' };
  }

  /**
   * List all holidays
   */
  async getHolidays() {
    return prisma.holiday.findMany({
      orderBy: { date: 'asc' },
    });
  }
}

export default new HolidayService();
