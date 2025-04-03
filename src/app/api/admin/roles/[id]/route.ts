import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '@/middleware/withRedis';
import { withAuth } from '@/middleware/withAuth';
import { RoleService } from '@/lib/role/role-service';

/**
 * GET handler for retrieving a specific role
 * 
 * @param request The incoming request
 * @param params The route parameters (id)
 * @returns JSON response with the role
 */
export const GET = withRedis(
  withAuth(
    async (request: NextRequest, { params }: { params: { id: string } }) => {
      const { id } = params;
      
      try {
        // Get the tenant ID from the auth object (set by withAuth middleware)
        const tenantId = (request as any).auth?.tenantId;
        
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Tenant ID is required' },
            { status: 400 }
          );
        }
        
        // Get the role
        const role = await RoleService.getRole(id);
        
        if (!role) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }
        
        // Verify the role belongs to the tenant
        if (role.tenantId !== tenantId) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }
        
        // Get user count for the role
        const userCount = await RoleService.getRoleUserCount(id);
        
        // Add additional information
        const roleWithDetails = {
          ...role,
          userCount,
          canModify: role.type !== 'system'
        };
        
        return NextResponse.json(roleWithDetails);
      } catch (error: any) {
        console.error(`Error retrieving role ${id}:`, error);
        
        return NextResponse.json(
          { error: error.message || 'Failed to retrieve role' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'read:role' }
  )
);

/**
 * PUT handler for updating a role
 * 
 * @param request The incoming request
 * @param params The route parameters (id)
 * @returns JSON response with the updated role
 */
export const PUT = withRedis(
  withAuth(
    async (request: NextRequest, { params }: { params: { id: string } }) => {
      const { id } = params;
      
      try {
        // Get the tenant ID from the auth object (set by withAuth middleware)
        const tenantId = (request as any).auth?.tenantId;
        
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Tenant ID is required' },
            { status: 400 }
          );
        }
        
        // Get the existing role
        const existingRole = await RoleService.getRole(id);
        
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }
        
        // Verify the role belongs to the tenant
        if (existingRole.tenantId !== tenantId) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }
        
        // Verify the role can be modified
        if (existingRole.type === 'system') {
          return NextResponse.json(
            { error: 'System roles cannot be modified' },
            { status: 403 }
          );
        }
        
        // Parse request body
        const data = await request.json();
        
        // Validate required fields
        if (!data.name || !data.description) {
          return NextResponse.json(
            { error: 'Name and description are required' },
            { status: 400 }
          );
        }
        
        // Validate permissions
        if (!Array.isArray(data.permissions) || data.permissions.length === 0) {
          return NextResponse.json(
            { error: 'At least one permission is required' },
            { status: 400 }
          );
        }
        
        // Update the role
        const updatedRole = await RoleService.updateRole(id, {
          name: data.name,
          description: data.description,
          isGlobal: data.isGlobal || false,
          scope: data.scope || existingRole.scope,
          aclEntries: data.permissions.map((permission: any) => ({
            resource: {
              type: permission.resource,
              tenantId,
              siteId: permission.siteId
            },
            permission: permission.action
          }))
        });
        
        return NextResponse.json(updatedRole);
      } catch (error: any) {
        console.error(`Error updating role ${id}:`, error);
        
        if (error.message === 'Role with this name already exists') {
          return NextResponse.json(
            { error: error.message },
            { status: 409 }
          );
        }
        
        return NextResponse.json(
          { error: error.message || 'Failed to update role' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'manage:role' }
  )
);

/**
 * DELETE handler for deleting a role
 * 
 * @param request The incoming request
 * @param params The route parameters (id)
 * @returns JSON response with success message
 */
export const DELETE = withRedis(
  withAuth(
    async (request: NextRequest, { params }: { params: { id: string } }) => {
      const { id } = params;
      
      try {
        // Get the tenant ID from the auth object (set by withAuth middleware)
        const tenantId = (request as any).auth?.tenantId;
        
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Tenant ID is required' },
            { status: 400 }
          );
        }
        
        // Get the existing role
        const existingRole = await RoleService.getRole(id);
        
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }
        
        // Verify the role belongs to the tenant
        if (existingRole.tenantId !== tenantId) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }
        
        // Verify the role can be deleted
        if (existingRole.type === 'system') {
          return NextResponse.json(
            { error: 'System roles cannot be deleted' },
            { status: 403 }
          );
        }
        
        // Check if the role is assigned to any users
        const userCount = await RoleService.getRoleUserCount(id);
        
        if (userCount > 0) {
          return NextResponse.json(
            { error: 'Cannot delete a role that is assigned to users' },
            { status: 409 }
          );
        }
        
        // Delete the role
        await RoleService.deleteRole(id);
        
        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error(`Error deleting role ${id}:`, error);
        
        return NextResponse.json(
          { error: error.message || 'Failed to delete role' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'manage:role' }
  )
);
