import { Request, Response } from 'express';
import { OrganizationService } from '../services/organization.service';

/**
 * Organization Controller
 * Handles HTTP requests for organization management.
 */
export class OrganizationController {

  /**
   * POST /api/v1/organizations/register
   * Register a new organization (public endpoint)
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, slug, logoUrl, primaryColor, domain } = req.body;

      if (!name || !slug) {
        res.status(400).json({
          success: false,
          message: 'Name and slug are required',
        });
        return;
      }

      // Validate slug format
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (cleanSlug.length < 3 || cleanSlug.length > 50) {
        res.status(400).json({
          success: false,
          message: 'Slug must be 3-50 characters, lowercase alphanumeric and hyphens only',
        });
        return;
      }

      const organization = await OrganizationService.create({
        name,
        slug: cleanSlug,
        logoUrl,
        primaryColor,
        domain,
      });

      res.status(201).json({
        success: true,
        message: 'Organization registered successfully',
        data: organization,
      });
    } catch (error: any) {
      if (error.message.includes('already exists') || error.message.includes('already registered')) {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to register organization',
      });
    }
  }

  /**
   * GET /api/v1/organizations/me
   * Get current organization details (requires auth + org context)
   */
  static async getMyOrganization(req: Request, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization context required',
        });
        return;
      }

      const org = await OrganizationService.getById(req.organizationId);
      if (!org) {
        res.status(404).json({
          success: false,
          message: 'Organization not found',
        });
        return;
      }

      res.json({
        success: true,
        data: org,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch organization',
      });
    }
  }

  /**
   * PUT /api/v1/organizations/me
   * Update current organization (HR/Admin only)
   */
  static async updateMyOrganization(req: Request, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization context required',
        });
        return;
      }

      const { name, logoUrl, primaryColor, domain } = req.body;

      const org = await OrganizationService.update(req.organizationId, {
        name,
        logoUrl,
        primaryColor,
        domain,
      });

      res.json({
        success: true,
        message: 'Organization updated successfully',
        data: org,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update organization',
      });
    }
  }

  /**
   * GET /api/v1/organizations/me/stats
   * Get organization statistics
   */
  static async getMyOrgStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization context required',
        });
        return;
      }

      const stats = await OrganizationService.getStats(req.organizationId);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch stats',
      });
    }
  }

  /**
   * GET /api/v1/organizations/me/plan-limits
   * Check plan limits for interns/mentors
   */
  static async checkPlanLimits(req: Request, res: Response): Promise<void> {
    try {
      if (!req.organizationId) {
        res.status(400).json({
          success: false,
          message: 'Organization context required',
        });
        return;
      }

      const type = (req.query.type as string) || 'intern';
      if (!['intern', 'mentor'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Type must be "intern" or "mentor"',
        });
        return;
      }

      const limits = await OrganizationService.checkPlanLimits(
        req.organizationId,
        type as 'intern' | 'mentor'
      );

      res.json({
        success: true,
        data: limits,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check plan limits',
      });
    }
  }

  /**
   * GET /api/v1/organizations (Super Admin only)
   * List all organizations
   */
  static async listAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await OrganizationService.listAll(page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to list organizations',
      });
    }
  }

  /**
   * GET /api/v1/organizations/slug/:slug
   * Check if a slug is available
   */
  static async checkSlug(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      if (typeof slug !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid slug',
        });
        return;
      }
      const existing = await OrganizationService.getBySlug(slug);

      res.json({
        success: true,
        data: {
          slug,
          available: !existing,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to check slug',
      });
    }
  }
}
