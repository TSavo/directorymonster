/**
 * Middleware for validating tenant context in API requests
 * Ensures proper multi-tenant isolation
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import TenantMembershipService from '@/lib/tenant-membership-service';
import RoleService from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

/**
 * Extract and validate JWT token from authorization header
 * @param authHeader Authorization header
 * @returns Decoded token or null if invalid
 */
function verifyAuthToken(authHeader: string | null): { userId: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    // Handle both direct jwt and jwt.default for testing compatibility
    const jwtVerify = typeof jwt.verify === 'function' ? jwt.verify : jwt.default?.verify;
    if (!jwtVerify) {
      throw new Error('JWT verify function not available');
    }

    // Enhanced security options for token verification
    const verifyOptions = {
      // Explicitly check expiration
      ignoreExpiration: false,
      // Only accept tokens signed with the algorithm we expect
      // Note: In a production system, RS256 would be preferred over HS256
      algorithms: ['HS256'] as jwt.Algorithm[]
    };

    const decoded = jwtVerify(token, process.env.JWT_SECRET!, verifyOptions) as { userId: string };

    // Additional validation for required claims
    if (!decoded.userId) {
      console.error('Invalid token: missing userId claim');
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Invalid auth token:', error);
    return null;
  }
}

/**
 * Middleware to validate tenant access
 * Ensures the user belongs to the tenant specified in the request
 */
export async function withTenantAccess(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const tenantId = req.headers.get('x-tenant-id');
  const authHeader = req.headers.get('authorization');

  // Check for tenant ID and auth header
  if (!tenantId || !authHeader) {
    return NextResponse.json(
      { error: 'Missing tenant context or authentication' },
      { status: 401 }
    );
  }

  // Verify auth token
  const decoded = verifyAuthToken(authHeader);
  if (!decoded) {
    return NextResponse.json(
      { error: 'Invalid or expired authentication token' },
      { status: 401 }
    );
  }

  // Check if user is a member of this tenant
  const isMember = await TenantMembershipService.isTenantMember(
    decoded.userId,
    tenantId
  );

  if (!isMember) {
    return NextResponse.json(
      { error: 'Access denied: User is not a member of this tenant' },
      { status: 403 }
    );
  }

  // User has access to this tenant, proceed with the request
  return handler(req);
}

/**
 * Middleware to validate specific permission in tenant context
 * Ensures the user has the required permission for the resource in this tenant
 */
export async function withPermission(
  req: NextRequest,
  resourceType: ResourceType,
  permission: Permission,
  resourceId?: string,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const tenantId = req.headers.get('x-tenant-id')!;
  const authHeader = req.headers.get('authorization')!;

  // Use tenant validation first
  const tenantResponse = await withTenantAccess(req, async () => {
    // Extract user ID from auth token
    const decoded = verifyAuthToken(authHeader)!;

    // Check if user has the required permission
    const hasPermission = await RoleService.hasPermission(
      decoded.userId,
      tenantId,
      resourceType,
      permission,
      resourceId
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          error: `Permission denied: Required ${permission} permission for ${resourceType}`
        },
        { status: 403 }
      );
    }

    // User has required permission, proceed with the request
    return handler(req);
  });

  return tenantResponse;
}

/**
 * Middleware to add tenant context from hostname
 * Used to automatically resolve tenant from request hostname
 */
export async function withTenantContext(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Get hostname from request or x-forwarded-host header
  const hostname = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';

  // Get tenant ID from hostname using TenantService
  const TenantService = (await import('@/lib/tenant/tenant-service')).default;
  const tenant = await TenantService.getTenantByHostname(hostname);

  if (!tenant) {
    return NextResponse.json(
      { error: `Invalid tenant hostname: ${hostname}` },
      { status: 404 }
    );
  }

  // Clone request and add tenant ID header
  const requestWithTenant = new NextRequest(req.url, {
    headers: new Headers(req.headers),
    method: req.method,
    body: req.body,
    cache: req.cache,
    credentials: req.credentials,
    integrity: req.integrity,
    keepalive: req.keepalive,
    mode: req.mode,
    redirect: req.redirect,
    referrer: req.referrer,
    referrerPolicy: req.referrerPolicy,
  });

  requestWithTenant.headers.set('x-tenant-id', tenant.id);

  // Proceed with the enhanced request
  return handler(requestWithTenant);
}
