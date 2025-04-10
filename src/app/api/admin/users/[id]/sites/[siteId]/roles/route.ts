import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { addUserSiteRole } from '@/lib/user/user-service';

interface RouteParams {
  params: {
    id: string;
    siteId: string;
  };
}

/**
 * POST /api/admin/users/[id]/sites/[siteId]/roles
 * 
 * Add a site-specific role to a user
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response indicating success
 */
export const POST = withACL(
  withTenant(async (req: NextRequest, { params }: RouteParams) => {
    try {
      const { id, siteId } = params;
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }
      
      const data = await req.json();
      const roleId = data.roleId as string;
      
      if (!roleId) {
        return NextResponse.json(
          { error: 'Role ID is required' },
          { status: 400 }
        );
      }
      
      await addUserSiteRole(id, tenantId, siteId, roleId);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error adding site role to user:', error);
      return NextResponse.json(
        { error: 'Failed to add site role to user' },
        { status: 500 }
      );
    }
  }),
  { resource: 'user', action: 'update' }
);
