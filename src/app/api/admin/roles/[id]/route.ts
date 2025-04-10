import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { getRole, updateRole, deleteRole } from '@/lib/role/role-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/roles/[id]
 * 
 * Get a specific role by ID
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response with the role
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
      
      return NextResponse.json({ role });
    } catch (error) {
      console.error('Error fetching role:', error);
      return NextResponse.json(
        { error: 'Failed to fetch role' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'read' }
);

/**
 * PATCH /api/admin/roles/[id]
 * 
 * Update a specific role by ID
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response with the updated role
 */
export const PATCH = withACL(
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
          { error: 'Cannot modify system roles' },
          { status: 403 }
        );
      }
      
      const updatedRole = await updateRole(id, tenantId, data);
      
      return NextResponse.json({ role: updatedRole });
    } catch (error) {
      console.error('Error updating role:', error);
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'update' }
);

/**
 * DELETE /api/admin/roles/[id]
 * 
 * Delete a specific role by ID
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response indicating success
 */
export const DELETE = withACL(
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
      
      // Don't allow deleting system roles
      if (existingRole.type === 'system') {
        return NextResponse.json(
          { error: 'Cannot delete system roles' },
          { status: 403 }
        );
      }
      
      await deleteRole(id, tenantId);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting role:', error);
      return NextResponse.json(
        { error: 'Failed to delete role' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'delete' }
);
