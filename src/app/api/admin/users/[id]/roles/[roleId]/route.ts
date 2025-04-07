import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { removeUserRole } from '@/lib/user/user-service';

interface RouteParams {
  params: {
    id: string;
    roleId: string;
  };
}

/**
 * DELETE /api/admin/users/[id]/roles/[roleId]
 * 
 * Remove a role from a user
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response indicating success
 */
export const DELETE = withACL(
  withTenant(async (req: NextRequest, { params }: RouteParams) => {
    try {
      const { id, roleId } = params;
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }
      
      await removeUserRole(id, tenantId, roleId);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error removing role from user:', error);
      return NextResponse.json(
        { error: 'Failed to remove role from user' },
        { status: 500 }
      );
    }
  }),
  { resource: 'user', action: 'update' }
);
