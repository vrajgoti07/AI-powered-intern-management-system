import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';
import prisma from '../config/database';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage instance to propagate organization context across asynchronous query flows
export const tenantLocalStorage = new AsyncLocalStorage<string>();

/**
 * Extend Express Request to include organization context
 */
declare global {
  namespace Express {
    interface Request {
      organization?: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
        primaryColor: string;
        plan: string;
        maxInterns: number;
        maxMentors: number;
        isActive: boolean;
      };
      organizationId?: string;
    }
  }
}

const ORG_CACHE_TTL = 600; // 10 minutes

/**
 * Tenant Middleware
 * Extracts organization from:
 *   1. X-Organization-Slug header (dev mode)
 *   2. Subdomain (production)
 * Caches org lookups in Redis for 10 minutes.
 * 
 * If no org context is found, request proceeds WITHOUT organization
 * (backwards compatible for single-org setups).
 */
export const tenantMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let slug: string | undefined;

    // 1. Check X-Organization-Slug header (dev / API clients)
    const headerSlug = req.headers['x-organization-slug'];
    if (headerSlug && typeof headerSlug === 'string') {
      slug = headerSlug;
    }

    // 2. Extract subdomain from hostname (production + local dev subdomains)
    if (!slug) {
      const hostname = req.hostname;
      const parts = hostname.split('.');
      // Support subdomains in local dev (e.g., acme.localhost) and production (e.g., acme.internflow.app)
      const isLocalhost = hostname.endsWith('localhost') || hostname === '127.0.0.1';
      if (isLocalhost) {
        if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www' && parts[0] !== 'api') {
          slug = parts[0];
        }
      } else {
        if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
          slug = parts[0];
        }
      }
    }

    // No slug → proceed without org context (backwards compatible)
    if (!slug) {
      return next();
    }

    // 3. Check Redis cache first
    let orgData: typeof req.organization | null = null;
    const cacheKey = `org:slug:${slug}`;

    try {
      if (redis.status === 'ready') {
        const cached = await redis.get(cacheKey);
        if (cached) {
          orgData = JSON.parse(cached);
        }
      }
    } catch {
      // Redis unavailable — fall through to DB
    }

    // 4. Cache miss → query database
    if (!orgData) {
      const org = await prisma.organization.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          primaryColor: true,
          plan: true,
          maxInterns: true,
          maxMentors: true,
          isActive: true,
        },
      });

      if (org && org.isActive) {
        orgData = org;

        // Cache in Redis
        try {
          if (redis.status === 'ready') {
            await redis.setex(cacheKey, ORG_CACHE_TTL, JSON.stringify(org));
          }
        } catch {
          // Redis write failure is non-fatal
        }
      }
    }

    // 5. Attach to request
    if (orgData && orgData.isActive) {
      req.organization = orgData;
      req.organizationId = orgData.id;
    }

    if (req.organizationId) {
      tenantLocalStorage.run(req.organizationId, () => {
        next();
      });
    } else {
      next();
    }
  } catch (error) {
    // Tenant resolution failure should not block the request
    console.error('Tenant middleware error:', error);
    next();
  }
};

/**
 * Require Organization Middleware
 * Use on routes that REQUIRE a tenant context.
 * Returns 400 if no organization is resolved.
 */
export const requireOrganization = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.organization || !req.organizationId) {
    res.status(400).json({
      success: false,
      message: 'Organization context required. Provide X-Organization-Slug header or use a subdomain.',
    });
    return;
  }
  next();
};
