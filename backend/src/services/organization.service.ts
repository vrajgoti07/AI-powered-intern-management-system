import prisma from '../config/database';
import redis from '../config/redis';
import { OrganizationPlan } from '@prisma/client';

interface CreateOrganizationInput {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  domain?: string;
  plan?: OrganizationPlan;
}

interface UpdateOrganizationInput {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  domain?: string;
}

/**
 * Organization Service
 * Handles CRUD operations for multi-tenant organizations.
 */
export class OrganizationService {

  /**
   * Create a new organization
   */
  static async create(data: CreateOrganizationInput) {
    const cleanedSlug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanedSlug || cleanedSlug.length < 3) {
      throw new Error('Invalid organization slug (must be at least 3 alphanumeric characters/hyphens)');
    }

    // Check slug uniqueness
    const existingSlug = await prisma.organization.findUnique({
      where: { slug: cleanedSlug },
    });
    if (existingSlug) {
      throw new Error('Organization slug already exists');
    }

    // Check domain uniqueness if provided
    if (data.domain) {
      const existingDomain = await prisma.organization.findUnique({
        where: { domain: data.domain },
      });
      if (existingDomain) {
        throw new Error('Domain already registered to another organization');
      }
    }

    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        slug: cleanedSlug,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor || '#6366F1',
        domain: data.domain,
        plan: data.plan || 'FREE',
      },
    });

    return organization;
  }

  /**
   * Get organization by ID
   */
  static async getById(id: string) {
    return prisma.organization.findUnique({
      where: { id },
    });
  }

  /**
   * Get organization by slug (with Redis caching)
   */
  static async getBySlug(slug: string) {
    const cacheKey = `org:slug:${slug}`;

    try {
      if (redis.status === 'ready') {
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);
      }
    } catch {
      // Redis unavailable
    }

    const org = await prisma.organization.findUnique({
      where: { slug },
    });

    if (org) {
      try {
        if (redis.status === 'ready') {
          await redis.setex(cacheKey, 600, JSON.stringify(org));
        }
      } catch {
        // Non-fatal
      }
    }

    return org;
  }

  /**
   * Update organization details
   */
  static async update(id: string, data: UpdateOrganizationInput) {
    // Check domain uniqueness if domain is being updated and has changed
    if (data.domain) {
      const existingDomain = await prisma.organization.findFirst({
        where: {
          domain: data.domain,
          id: { not: id },
        },
      });
      if (existingDomain) {
        throw new Error('Domain already registered to another organization');
      }
    }

    const org = await prisma.organization.update({
      where: { id },
      data,
    });

    // Invalidate cache
    try {
      if (redis.status === 'ready') {
        await redis.del(`org:slug:${org.slug}`);
      }
    } catch {
      // Non-fatal
    }

    return org;
  }

  /**
   * Get organization stats
   */
  static async getStats(organizationId: string) {
    const [userCount, internCount, mentorCount, departmentCount] = await Promise.all([
      prisma.user.count({ where: { organizationId } }),
      prisma.intern.count({ where: { organizationId } }),
      prisma.mentor.count({ where: { organizationId } }),
      prisma.department.count({ where: { organizationId } }),
    ]);

    return {
      users: userCount,
      interns: internCount,
      mentors: mentorCount,
      departments: departmentCount,
    };
  }

  /**
   * Check if organization is within plan limits
   */
  static async checkPlanLimits(organizationId: string, type: 'intern' | 'mentor') {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) throw new Error('Organization not found');

    if (type === 'intern') {
      const currentInterns = await prisma.intern.count({
        where: { organizationId, status: { in: ['ACTIVE', 'ONBOARDING', 'PENDING'] } },
      });
      return {
        allowed: currentInterns < org.maxInterns,
        current: currentInterns,
        max: org.maxInterns,
        plan: org.plan,
      };
    }

    if (type === 'mentor') {
      const currentMentors = await prisma.mentor.count({
        where: { organizationId },
      });
      return {
        allowed: currentMentors < org.maxMentors,
        current: currentMentors,
        max: org.maxMentors,
        plan: org.plan,
      };
    }

    return { allowed: true, current: 0, max: 0, plan: org.plan };
  }

  /**
   * List all organizations (Super Admin only)
   */
  static async listAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.organization.count({ where: { deletedAt: null } }),
    ]);

    return {
      data: organizations,
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
   * Soft delete organization
   */
  static async softDelete(id: string) {
    const org = await prisma.organization.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });

    // Invalidate cache
    try {
      if (redis.status === 'ready') {
        await redis.del(`org:slug:${org.slug}`);
      }
    } catch {
      // Non-fatal
    }

    return org;
  }
}
