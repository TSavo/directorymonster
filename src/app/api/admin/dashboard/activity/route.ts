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
 * GET /api/admin/dashboard/activity
 *
 * Retrieves recent activity for the admin dashboard
 * Requires 'read' permission on 'audit' resource
 *
 * @param req The incoming request
 * @returns Recent activity data
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
