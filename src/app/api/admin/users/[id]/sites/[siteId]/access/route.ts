import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { grantSiteAccess, revokeSiteAccess } from '@/lib/user/user-service';

interface RouteParams {
  params: {
    id: string;
    siteId: string;
  };
}

/**
 * POST /api/admin/users/[id]/sites/[siteId]/access
 * 
 * Grant access to a site for a user
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
      
      await grantSiteAccess(id, tenantId, siteId);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error granting site access:', error);
      return NextResponse.json(
        { error: 'Failed to grant site access' },
        { status: 500 }
      );
    }
  }),
  { resource: 'user', action: 'update' }
);

/**
 * DELETE /api/admin/users/[id]/sites/[siteId]/access
 * 
 * Revoke access to a site for a user
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response indicating success
 */
export const DELETE = withACL(
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
      
      await revokeSiteAccess(id, tenantId, siteId);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error revoking site access:', error);
      return NextResponse.json(
        { error: 'Failed to revoke site access' },
        { status: 500 }
      );
    }
  }),
  { resource: 'user', action: 'update' }
);
