import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { getUserSites } from '@/lib/user/user-service';
import { getAvailableSiteRoles } from '@/lib/role/role-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/users/[id]/sites
 * 
 * Get sites accessible to a user and their roles for each site
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response with the user sites and available roles
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
      
      // Get sites accessible to the user
      const sites = await getUserSites(id, tenantId);
      
      // Get available site-specific roles that can be assigned to the user
      const availableRoles = await getAvailableSiteRoles(id, tenantId);
      
      return NextResponse.json({ sites, availableRoles });
    } catch (error) {
      console.error('Error fetching user sites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user sites' },
        { status: 500 }
      );
    }
  }),
  { resource: 'user', action: 'read' }
);
