import ExcelJS from 'exceljs';
import { logger } from '../utils/logger';

// --- Style Presets ---
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E40AF' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  color: { argb: 'FFFFFFFF' },
  size: 11,
  name: 'Calibri',
};

const HEADER_ALIGNMENT: Partial<ExcelJS.Alignment> = {
  horizontal: 'center',
  vertical: 'middle',
};

const ALT_ROW_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF3F4F6' },
};

const CELL_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
  right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
};

// --- Helper: Style Header Row ---
function styleHeaderRow(sheet: ExcelJS.Worksheet): void {
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = HEADER_ALIGNMENT;
    cell.border = CELL_BORDER;
  });
  headerRow.height = 28;
}

// --- Helper: Style Data Rows ---
function styleDataRows(sheet: ExcelJS.Worksheet, startRow: number = 2): void {
  for (let i = startRow; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    row.eachCell((cell) => {
      cell.border = CELL_BORDER;
      cell.alignment = { vertical: 'middle' };
      if (i % 2 === 0) {
        cell.fill = ALT_ROW_FILL;
      }
    });
    row.height = 22;
  }
}

// --- Excel Service ---

export class ExcelService {
  /**
   * Export attendance data as a styled Excel workbook
   */
  async exportAttendanceExcel(data: any): Promise<ExcelJS.Workbook> {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'AI-Powered Intern Management System';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Attendance Report', {
        properties: { defaultColWidth: 18 },
      });

      // Column definitions
      sheet.columns = [
        { header: 'Date', key: 'date', width: 16 },
        { header: 'Check In', key: 'checkIn', width: 16 },
        { header: 'Check Out', key: 'checkOut', width: 16 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Notes', key: 'notes', width: 30 },
      ];

      // Add data rows
      data.records.forEach((record: any) => {
        sheet.addRow({
          date: record.date ? new Date(record.date).toLocaleDateString() : 'N/A',
          checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-',
          checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-',
          status: record.status || 'N/A',
          notes: record.notes || '-',
        });
      });

      styleHeaderRow(sheet);
      styleDataRows(sheet);

      // Status coloring
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const statusCell = row.getCell(4);
          const status = String(statusCell.value);
          if (status === 'PRESENT') {
            statusCell.font = { color: { argb: 'FF059669' }, bold: true };
          } else if (status === 'ABSENT') {
            statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
          } else if (status === 'HALF_DAY') {
            statusCell.font = { color: { argb: 'FFD97706' }, bold: true };
          } else if (status === 'LEAVE') {
            statusCell.font = { color: { argb: 'FF6366F1' }, bold: true };
          }
        }
      });

      // Summary sheet
      const summarySheet = workbook.addWorksheet('Summary', {
        properties: { defaultColWidth: 22 },
      });
      summarySheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      summarySheet.addRow({ metric: 'Intern Name', value: data.intern.name });
      summarySheet.addRow({ metric: 'Department', value: data.intern.department });
      summarySheet.addRow({ metric: 'Total Days', value: data.summary.totalDays });
      summarySheet.addRow({ metric: 'Present Days', value: data.summary.present });
      summarySheet.addRow({ metric: 'Absent Days', value: data.summary.absent });
      summarySheet.addRow({ metric: 'Half Days', value: data.summary.halfDay });
      summarySheet.addRow({ metric: 'Leave Days', value: data.summary.leave });
      summarySheet.addRow({ metric: 'Attendance Rate', value: `${data.summary.attendanceRate}%` });

      styleHeaderRow(summarySheet);
      styleDataRows(summarySheet);

      return workbook;
    } catch (error) {
      logger.error('Attendance Excel export error:', error);
      throw error;
    }
  }

  /**
   * Export task analytics as a styled Excel workbook
   */
  async exportTasksExcel(data: any): Promise<ExcelJS.Workbook> {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'AI-Powered Intern Management System';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Task Analytics', {
        properties: { defaultColWidth: 18 },
      });

      sheet.columns = [
        { header: 'Task Title', key: 'title', width: 30 },
        { header: 'Status', key: 'status', width: 14 },
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'Intern', key: 'intern', width: 20 },
        { header: 'Due Date', key: 'dueDate', width: 16 },
        { header: 'Overdue', key: 'overdue', width: 10 },
        { header: 'Created', key: 'created', width: 16 },
      ];

      data.recentTasks?.forEach((task: any) => {
        sheet.addRow({
          title: task.title,
          status: task.status,
          priority: task.priority,
          intern: task.internName,
          dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A',
          overdue: task.isOverdue ? 'YES' : 'NO',
          created: task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A',
        });
      });

      styleHeaderRow(sheet);
      styleDataRows(sheet);

      // Priority coloring
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const priorityCell = row.getCell(3);
          const priority = String(priorityCell.value);
          if (priority === 'HIGH') {
            priorityCell.font = { color: { argb: 'FFDC2626' }, bold: true };
          } else if (priority === 'MEDIUM') {
            priorityCell.font = { color: { argb: 'FFD97706' }, bold: true };
          }

          // Overdue coloring
          const overdueCell = row.getCell(6);
          if (String(overdueCell.value) === 'YES') {
            overdueCell.font = { color: { argb: 'FFDC2626' }, bold: true };
          }
        }
      });

      // Stats summary sheet
      const statsSheet = workbook.addWorksheet('Statistics', {
        properties: { defaultColWidth: 22 },
      });
      statsSheet.columns = [
        { header: 'Metric', key: 'metric', width: 25 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      statsSheet.addRow({ metric: 'Total Tasks', value: data.totalTasks });
      statsSheet.addRow({ metric: 'Completion Rate', value: `${data.avgCompletionRate}%` });
      statsSheet.addRow({ metric: 'Overdue Tasks', value: data.overdueCount });

      Object.entries(data.statusDistribution || {}).forEach(([status, count]) => {
        statsSheet.addRow({ metric: `Status: ${status}`, value: count as number });
      });
      Object.entries(data.priorityDistribution || {}).forEach(([priority, count]) => {
        statsSheet.addRow({ metric: `Priority: ${priority}`, value: count as number });
      });

      styleHeaderRow(statsSheet);
      styleDataRows(statsSheet);

      return workbook;
    } catch (error) {
      logger.error('Tasks Excel export error:', error);
      throw error;
    }
  }

  /**
   * Export department statistics as a styled Excel workbook
   */
  async exportDepartmentExcel(data: any): Promise<ExcelJS.Workbook> {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'AI-Powered Intern Management System';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Department Statistics', {
        properties: { defaultColWidth: 18 },
      });

      sheet.columns = [
        { header: 'Department', key: 'name', width: 22 },
        { header: 'Head', key: 'head', width: 20 },
        { header: 'Interns', key: 'interns', width: 12 },
        { header: 'Mentors', key: 'mentors', width: 12 },
        { header: 'Avg Score', key: 'avgScore', width: 14 },
        { header: 'Avg Attendance', key: 'avgAttendance', width: 16 },
        { header: 'Avg CGPA', key: 'avgCgpa', width: 12 },
        { header: 'Task Completion', key: 'taskCompletion', width: 18 },
      ];

      data.departments?.forEach((dept: any) => {
        sheet.addRow({
          name: dept.name,
          head: dept.head,
          interns: dept.internCount,
          mentors: dept.mentorCount,
          avgScore: dept.avgScore,
          avgAttendance: `${dept.avgAttendance}%`,
          avgCgpa: dept.avgCgpa,
          taskCompletion: `${dept.taskCompletionRate}%`,
        });
      });

      styleHeaderRow(sheet);
      styleDataRows(sheet);

      return workbook;
    } catch (error) {
      logger.error('Department Excel export error:', error);
      throw error;
    }
  }
}

export default new ExcelService();
