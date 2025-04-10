import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/acl/types';
import { getUserFromSession } from '@/lib/auth';
import { TenantMembershipService } from '@/lib/tenant-membership-service';

/**
 * GET handler for retrieving tenants for the current user
 * @param request The incoming request
 * @returns JSON response with tenant data or error
 */
export async function GET(request: NextRequest) {
  return withSecureTenantPermission(
    request,
    'tenant' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        // Get current user from session
        const currentUser = await getUserFromSession();

        if (!currentUser) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // Get tenants for the current user
        const tenants = await TenantMembershipService.getUserTenants(currentUser.id);

        // Return tenants data
        return NextResponse.json(tenants);
      } catch (error) {
        console.error('Error getting user tenants:', error);
        return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      }
    }
  );
}
