import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { getRole, updateRolePermissions } from '@/lib/role/role-service';
import { Permission } from '@/types/role';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/roles/[id]/permissions
 * 
 * Get permissions for a specific role
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response with the role permissions
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
      
      const role = await getRole(id, tenantId);
      
      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ permissions: role.permissions });
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch role permissions' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'read' }
);

/**
 * PUT /api/admin/roles/[id]/permissions
 * 
 * Update permissions for a specific role
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response with the updated role permissions
 */
export const PUT = withACL(
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
      
      // Ensure the role belongs to the current tenant
      const existingRole = await getRole(id, tenantId);
      
      if (!existingRole) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      
      // Don't allow modifying system roles
      if (existingRole.type === 'system') {
        return NextResponse.json(
          { error: 'Cannot modify system role permissions' },
          { status: 403 }
        );
      }
      
      const data = await req.json();
      const permissions = data.permissions as Permission[];
      
      if (!Array.isArray(permissions)) {
        return NextResponse.json(
          { error: 'Invalid permissions format' },
          { status: 400 }
        );
      }
      
      const updatedRole = await updateRolePermissions(id, tenantId, permissions);
      
      return NextResponse.json({ permissions: updatedRole.permissions });
    } catch (error) {
      console.error('Error updating role permissions:', error);
      return NextResponse.json(
        { error: 'Failed to update role permissions' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'update' }
);
