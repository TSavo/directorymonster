import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { getUserRoles, addUserRoles } from '@/lib/user/user-service';
import { getAvailableRoles } from '@/lib/role/role-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/users/[id]/roles
 * 
 * Get roles assigned to a user and available roles
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response with the user roles and available roles
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
      
      // Get roles assigned to the user
      const roles = await getUserRoles(id, tenantId);
      
      // Get available roles that can be assigned to the user
      const availableRoles = await getAvailableRoles(id, tenantId);
      
      return NextResponse.json({ roles, availableRoles });
    } catch (error) {
      console.error('Error fetching user roles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user roles' },
        { status: 500 }
      );
    }
  }),
  { resource: 'user', action: 'read' }
);

/**
 * POST /api/admin/users/[id]/roles
 * 
 * Add roles to a user
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response indicating success
 */
export const POST = withACL(
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
      
      const data = await req.json();
      const roleIds = data.roleIds as string[];
      
      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return NextResponse.json(
          { error: 'Invalid role IDs format' },
          { status: 400 }
        );
      }
      
      await addUserRoles(id, tenantId, roleIds);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error adding roles to user:', error);
      return NextResponse.json(
        { error: 'Failed to add roles to user' },
        { status: 500 }
      );
    }
  }),
  { resource: 'user', action: 'update' }
);
