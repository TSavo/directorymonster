import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { getUserEffectivePermissions } from '@/lib/user/user-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/users/[id]/permissions
 * 
 * Get effective permissions for a user
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response with the user's effective permissions
 */
export const GET = withACL(
  withTenant(async (req: NextRequest, { params }: RouteParams) => {
    try {
      const { id } = params;
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }
      
      // Get effective permissions for the user
      const { effectivePermissions, permissionSources } = await getUserEffectivePermissions(id, tenantId);
      
      return NextResponse.json({ effectivePermissions, permissionSources });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user permissions' },
        { status: 500 }
      );
    }
  }),
  { resource: 'user', action: 'read' }
);
