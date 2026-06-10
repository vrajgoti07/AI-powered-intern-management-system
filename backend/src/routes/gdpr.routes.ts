import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';
import dataExportService from '../services/dataExport.service';
import erasureService from '../services/erasure.service';
import prisma from '../config/database';
import * as path from 'path';
import * as fs from 'fs';

const router = Router();

/**
 * GET /api/gdpr/erasure/confirm
 * Public confirmation endpoint clicked from the verification email
 */
router.get('/erasure/confirm', async (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).send('<h1>Error</h1><p>Verification token is missing.</p>');
      return;
    }

    await erasureService.confirmErasure(token);
    
    // Redirect to success page on frontend or send direct success response
    res.send('<h1>Success</h1><p>Your right to erasure request has been confirmed. It is now pending HR final approval.</p>');
  } catch (error: any) {
    res.status(400).send(`<h1>Verification Failed</h1><p>${error.message}</p>`);
  }
});

// Authenticated GDPR routes
router.use(authenticate);

/**
 * POST /api/gdpr/export
 * Request data export
 */
router.post('/export', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user!.organizationId;

    if (!orgId) {
      res.status(400).json({ success: false, message: 'User is not associated with an organization' });
      return;
    }

    const request = await dataExportService.requestExport(userId, orgId);
    res.status(202).json({
      success: true,
      message: 'Data export request submitted and is processing.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gdpr/export/history
 * View data export requests history
 */
router.get('/export/history', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const history = await dataExportService.getRequestHistory(userId);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/gdpr/export/download/:requestId
 * Download the generated ZIP file
 */
router.get('/export/download/:requestId', async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const userId = req.user!.id;
    const role = req.user!.role;

    const request = await prisma.dataExportRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      res.status(404).json({ success: false, message: 'Export request not found' });
      return;
    }

    // Auth guard: requester must own the export unless they are HR/Admin
    if (request.userId !== userId && role !== 'HR' && role !== 'SUPER_ADMIN') {
      res.status(403).json({ success: false, message: 'Unauthorized to download this archive' });
      return;
    }

    if (request.status !== 'READY') {
      res.status(400).json({ success: false, message: `Export is not ready. Status: ${request.status}` });
      return;
    }

    if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
      res.status(410).json({ success: false, message: 'This download link has expired' });
      return;
    }

    if (!request.fileUrl) {
      res.status(500).json({ success: false, message: 'File URL is missing' });
      return;
    }

    const filePath = path.join(process.cwd(), request.fileUrl);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, message: 'Physical file not found on disk' });
      return;
    }

    // Update downloaded status
    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: {
        status: 'DOWNLOADED',
        downloadedAt: new Date(),
      },
    });

    res.download(filePath, `internflow_export_${userId}.zip`);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/gdpr/erasure
 * Request account erasure
 */
router.post('/erasure', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user!.organizationId;
    const { reason } = req.body;

    if (!orgId) {
      res.status(400).json({ success: false, message: 'User is not associated with an organization' });
      return;
    }

    // Check if already has a pending/confirmed request
    const existing = await prisma.erasureRequest.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existing) {
      res.status(409).json({ success: false, message: 'You already have an active deletion request in progress.' });
      return;
    }

    const request = await erasureService.requestErasure(userId, reason, orgId);
    res.status(202).json({
      success: true,
      message: 'Erasure request submitted. Please check your email to confirm the request.',
      data: request,
    });
  } catch (error) {
    next(error);
  }
});

// HR-only GDPR administration routes
router.use(authorize('HR', 'SUPER_ADMIN'));

/**
 * GET /api/gdpr/erasure/requests
 * View all confirmed and pending erasure requests
 */
router.get('/erasure/requests', async (req, res, next) => {
  try {
    const orgId = req.user!.organizationId!;
    const requests = await erasureService.getConfirmedRequests(orgId);
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/gdpr/erasure/requests/:requestId/approve
 * HR approves and executes account erasure
 */
router.post('/erasure/requests/:requestId/approve', async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const orgId = req.user!.organizationId!;
    const hrUserId = req.user!.id;

    await erasureService.approveErasure(requestId, hrUserId, orgId);
    res.json({ success: true, message: 'Account erasure and anonymization completed successfully.' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/gdpr/erasure/requests/:requestId/reject
 * HR rejects the erasure request
 */
router.post('/erasure/requests/:requestId/reject', async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const orgId = req.user!.organizationId!;
    const hrUserId = req.user!.id;

    await erasureService.rejectErasure(requestId, hrUserId, orgId);
    res.json({ success: true, message: 'Erasure request has been rejected.' });
  } catch (error) {
    next(error);
  }
});

export default router;
