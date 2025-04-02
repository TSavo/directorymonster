import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/lib/role-service';
import { SiteService } from '@/lib/site-service';

/**
 * Middleware to check if a user has permission to access a specific site
 * 
 * @param req - The incoming request
 * @param siteId - The site ID to check permissions for (null for tenant-wide access)
 * @param permission - The permission to check ('read', 'write', 'delete', etc.)
 * @param handler - The handler function to call if the user has permission
 * @returns The response from the handler or an error response
 */
export async function withSitePermission(
  req: NextRequest,
  siteId: string | null,
  permission: string,
  handler: (req: NextRequest) => Promise<Response>
): Promise<Response> {
  try {
    // Get tenant ID from request headers
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Tenant ID is required' },
        { status: 401 }
      );
    }

    // Get user ID from request (assuming it's been authenticated)
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User ID is required' },
        { status: 401 }
      );
    }

    // If no specific site ID is provided, check for tenant-wide site access
    if (!siteId) {
      // Check if user has tenant-wide site access
      const hasTenantWideAccess = await RoleService.hasSitePermission(
        userId,
        tenantId,
        null, // null siteId means tenant-wide access
        permission
      );

      if (!hasTenantWideAccess) {
        return NextResponse.json(
          { 
            error: 'Forbidden', 
            message: `You do not have tenant-wide ${permission} permission for sites` 
          },
          { status: 403 }
        );
      }
    } else {
      // Check if user has permission for the specific site
      const hasSitePermission = await RoleService.hasSitePermission(
        userId,
        tenantId,
        siteId,
        permission
      );

      if (!hasSitePermission) {
        return NextResponse.json(
          { 
            error: 'Forbidden', 
            message: `You do not have ${permission} permission for site ${siteId}` 
          },
          { status: 403 }
        );
      }
    }

    // User has the required permission, proceed with the request
    return await handler(req);
  } catch (error) {
    console.error('Error in withSitePermission middleware:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'An error occurred while checking site permissions' },
      { status: 500 }
    );
  }
}
