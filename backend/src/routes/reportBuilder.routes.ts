import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import reportBuilderService from '../services/reportBuilder.service';

const router = Router();

// Authenticate all routes, authorize HR only
router.use(authenticate);
router.use(authorize('HR', 'SUPER_ADMIN'));

/**
 * GET /api/report-builder/saved
 * Retrieve all saved report configurations
 */
router.get('/saved', async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId!;
    const reports = await reportBuilderService.getSavedReports(orgId);
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/report-builder/save
 * Save a new report configuration
 */
router.post('/save', async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId!;
    const createdBy = req.user!.id;
    const { name, description, selectedColumns, filters, sortBy, sortOrder } = req.body;

    if (!name || !selectedColumns || !Array.isArray(selectedColumns) || selectedColumns.length === 0) {
      res.status(400).json({ success: false, message: 'Name and selected columns are required' });
      return;
    }

    const saved = await reportBuilderService.saveReport({
      name,
      description,
      selectedColumns,
      filters: filters || {},
      sortBy,
      sortOrder,
      createdBy,
      organizationId: orgId,
    });

    res.status(201).json({ success: true, data: saved });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/report-builder/generate
 * Preview report data as JSON
 */
router.post('/generate', async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId!;
    const { filters, sortBy, sortOrder, selectedColumns } = req.body;

    if (!selectedColumns || !Array.isArray(selectedColumns) || selectedColumns.length === 0) {
      res.status(400).json({ success: false, message: 'selectedColumns array is required' });
      return;
    }

    const data = await reportBuilderService.generateReportData(
      filters || {},
      sortBy,
      sortOrder,
      selectedColumns,
      orgId
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/report-builder/export
 * Export report as Excel or PDF buffer download
 */
router.post('/export', async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId!;
    const { filters, sortBy, sortOrder, selectedColumns, format } = req.body;

    if (!selectedColumns || !Array.isArray(selectedColumns) || selectedColumns.length === 0) {
      res.status(400).json({ success: false, message: 'selectedColumns array is required' });
      return;
    }

    const data = await reportBuilderService.generateReportData(
      filters || {},
      sortBy,
      sortOrder,
      selectedColumns,
      orgId
    );

    if (format === 'excel') {
      const buffer = await reportBuilderService.generateReportExcel(data, selectedColumns);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="custom_intern_report.xlsx"');
      res.send(buffer);
    } else if (format === 'pdf') {
      const buffer = await reportBuilderService.generateReportPDF(data, selectedColumns);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="custom_intern_report.pdf"');
      res.send(buffer);
    } else {
      res.status(400).json({ success: false, message: 'Invalid format requested. Use "excel" or "pdf"' });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
