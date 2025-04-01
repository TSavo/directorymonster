import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withPermission } from '@/middleware/withPermission';
import { AuditService } from '@/lib/audit-service';
import { RoleService } from '@/lib/role-service';
import { verify } from 'jsonwebtoken';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

// Get JWT secret from environment
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

/**
 * Retrieves recent activity events for the admin dashboard.
 *
 * This endpoint validates the request for tenant access and the required 'read' permission on the audit resource.
 * It extracts tenant context and user information from headers, verifies the JWT token from the authorization header to
 * determine the user ID, and supports query parameters for pagination and filtering (limit, offset, entityType, actionType, and userId).
 * If the user is a global admin, events across tenants are returned.
 *
 * @param req - The incoming NextRequest with tenant information, authorization credentials, and optional query parameters.
 * @returns A NextResponse with a JSON object containing the retrieved activity events, or an error message if retrieval fails.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withPermission(
      req,
      'audit' as ResourceType,
      'read' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context and user info
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;
          const authHeader = validatedReq.headers.get('authorization') as string;
          const token = authHeader.replace('Bearer ', '');
          const decoded = verify(token, JWT_SECRET) as { userId: string };
          const userId = decoded.userId;

          // Get query parameters
          const url = new URL(validatedReq.url);
          const limit = parseInt(url.searchParams.get('limit') || '10', 10);
          const offset = parseInt(url.searchParams.get('offset') || '0', 10);
          const entityType = url.searchParams.get('entityType') || undefined;
          const actionType = url.searchParams.get('actionType') || undefined;
          const userIdParam = url.searchParams.get('userId') || undefined;

          // Check if user is a global admin (can see cross-tenant events)
          const isGlobalAdmin = await RoleService.hasGlobalRole(userId);

          // Query recent activity
          const activities = await AuditService.queryEvents(
            {
              tenantId: isGlobalAdmin ? undefined : tenantId,
              limit,
              offset,
              resourceType: entityType,
              action: actionType,
              userId: userIdParam
            },
            tenantId,
            isGlobalAdmin
          );

          return NextResponse.json({ activities });
        } catch (error) {
          console.error('Error retrieving dashboard activity:', error);
          return NextResponse.json(
            { error: 'Failed to retrieve dashboard activity' },
            { status: 500 }
          );
        }
      }
    )
  );
}
