import { Request, Response, NextFunction } from 'express';
import reportService from '../services/report.service';
import pdfService from '../services/pdf.service';
import excelService from '../services/excel.service';
import analyticsService from '../services/analytics.service';
import { successResponse, errorResponse } from '../utils/response';
import { logger } from '../utils/logger';

export class ReportController {
  /**
   * Get performance report JSON
   * @route GET /api/v1/reports/performance
   */
  async getPerformanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const internId = req.query.internId as string;
      const result = await reportService.getPerformanceReport(internId);
      successResponse(res, 'Performance report generated successfully', result);
    } catch (error: any) {
      if (error.message === 'Intern not found') {
        errorResponse(res, 'Intern not found', 404);
        return;
      }
      next(error);
    }
  }

  /**
   * Get attendance report JSON
   * @route GET /api/v1/reports/attendance
   */
  async getAttendanceReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const internId = req.query.internId as string;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const result = await reportService.getAttendanceReport(internId, startDate, endDate);
      successResponse(res, 'Attendance report generated successfully', result);
    } catch (error: any) {
      if (error.message === 'Intern not found') {
        errorResponse(res, 'Intern not found', 404);
        return;
      }
      next(error);
    }
  }

  /**
   * Get internship summary with graduation eligibility
   * @route GET /api/v1/reports/internship-summary
   */
  async getInternshipSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const internId = req.query.internId as string;
      const result = await reportService.getInternshipSummary(internId);
      successResponse(res, 'Internship summary generated successfully', result);
    } catch (error: any) {
      if (error.message === 'Intern not found') {
        errorResponse(res, 'Intern not found', 404);
        return;
      }
      next(error);
    }
  }

  /**
   * Export PDF document
   * @route GET /api/v1/reports/export-pdf
   * Types: attendance, performance, completion, summary
   */
  async exportPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as string;
      const internId = req.query.internId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      let pdfDoc: PDFKit.PDFDocument;
      let filename: string;

      switch (type) {
        case 'attendance': {
          if (!internId) {
            errorResponse(res, 'internId is required for attendance PDF', 400);
            return;
          }
          const data = await reportService.getAttendanceReport(internId, startDate, endDate);
          pdfDoc = await pdfService.exportAttendancePDF(data);
          filename = `attendance_report_${Date.now()}.pdf`;
          break;
        }
        case 'performance': {
          if (!internId) {
            errorResponse(res, 'internId is required for performance PDF', 400);
            return;
          }
          const data = await reportService.getPerformanceReport(internId);
          pdfDoc = await pdfService.exportPerformancePDF(data);
          filename = `performance_report_${Date.now()}.pdf`;
          break;
        }
        case 'completion': {
          if (!internId) {
            errorResponse(res, 'internId is required for completion certificate', 400);
            return;
          }
          const data = await reportService.getInternshipSummary(internId);
          pdfDoc = await pdfService.exportCompletionCertificate(data);
          filename = `completion_certificate_${Date.now()}.pdf`;
          break;
        }
        case 'summary': {
          // Fetch analytics data for summary PDF
          const dashboardStats = await analyticsService.getDashboardStats(req.user);
          const departmentData = await analyticsService.getDepartmentAnalytics({});
          const taskData = await analyticsService.getTaskAnalytics({});

          const summaryData = {
            ...dashboardStats.overview,
            departments: departmentData.departments,
            taskStats: taskData.statusDistribution,
          };

          pdfDoc = await pdfService.exportSummaryPDF(summaryData);
          filename = `analytics_summary_${Date.now()}.pdf`;
          break;
        }
        default: {
          errorResponse(res, 'Invalid export type. Use: attendance, performance, completion, summary', 400);
          return;
        }
      }

      // Stream PDF to response
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      pdfDoc.pipe(res);
    } catch (error: any) {
      logger.error('PDF export error:', error);
      if (error.message === 'Intern not found') {
        errorResponse(res, 'Intern not found', 404);
        return;
      }
      next(error);
    }
  }

  /**
   * Export Excel document
   * @route GET /api/v1/reports/export-excel
   * Types: attendance, tasks, departments
   */
  async exportExcel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const type = req.query.type as string;
      const internId = req.query.internId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      let workbook: any;
      let filename: string;

      switch (type) {
        case 'attendance': {
          if (!internId) {
            errorResponse(res, 'internId is required for attendance Excel', 400);
            return;
          }
          const data = await reportService.getAttendanceReport(internId, startDate, endDate);
          workbook = await excelService.exportAttendanceExcel(data);
          filename = `attendance_report_${Date.now()}.xlsx`;
          break;
        }
        case 'tasks': {
          const filter: any = {};
          if (internId) filter.internId = internId;
          if (startDate) filter.startDate = startDate;
          if (endDate) filter.endDate = endDate;

          const data = await analyticsService.getTaskAnalytics(filter);
          workbook = await excelService.exportTasksExcel(data);
          filename = `task_analytics_${Date.now()}.xlsx`;
          break;
        }
        case 'departments': {
          const departmentId = req.query.departmentId as string | undefined;
          const data = await analyticsService.getDepartmentAnalytics({
            departmentId,
          });
          workbook = await excelService.exportDepartmentExcel(data);
          filename = `department_stats_${Date.now()}.xlsx`;
          break;
        }
        default: {
          errorResponse(res, 'Invalid export type. Use: attendance, tasks, departments', 400);
          return;
        }
      }

      // Stream Excel buffer to response
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      logger.error('Excel export error:', error);
      if (error.message === 'Intern not found') {
        errorResponse(res, 'Intern not found', 404);
        return;
      }
      next(error);
    }
  }
}

export default new ReportController();
