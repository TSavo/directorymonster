import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '@/middleware/withRedis';
import { withAuth } from '@/middleware/withAuth';
import { RoleService } from '@/lib/role/role-service';
import { UserService } from '@/lib/user/user-service';

/**
 * POST handler for assigning a role to a user
 * 
 * @param request The incoming request
 * @param params The route parameters (id, roleId)
 * @returns JSON response with success message
 */
export const POST = withRedis(
  withAuth(
    async (request: NextRequest, { params }: { params: { id: string; roleId: string } }) => {
      const { id, roleId } = params;
      
      try {
        // Get the tenant ID from the auth object (set by withAuth middleware)
        const tenantId = (request as any).auth?.tenantId;
        
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Tenant ID is required' },
            { status: 400 }
          );
        }
        
        // Verify the user exists
        const user = await UserService.getUser(id);
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Verify the role exists and belongs to the tenant
        const role = await RoleService.getRole(roleId);
        
        if (!role) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }
        
        if (role.tenantId !== tenantId) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }
        
        // Assign the role to the user
        await RoleService.assignRoleToUser(id, tenantId, roleId);
        
        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error(`Error assigning role ${roleId} to user ${id}:`, error);
        
        return NextResponse.json(
          { error: error.message || 'Failed to assign role to user' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'manage:role' }
  )
);

/**
 * DELETE handler for removing a role from a user
 * 
 * @param request The incoming request
 * @param params The route parameters (id, roleId)
 * @returns JSON response with success message
 */
export const DELETE = withRedis(
  withAuth(
    async (request: NextRequest, { params }: { params: { id: string; roleId: string } }) => {
      const { id, roleId } = params;
      
      try {
        // Get the tenant ID from the auth object (set by withAuth middleware)
        const tenantId = (request as any).auth?.tenantId;
        
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Tenant ID is required' },
            { status: 400 }
          );
        }
        
        // Verify the user exists
        const user = await UserService.getUser(id);
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Verify the role exists and belongs to the tenant
        const role = await RoleService.getRole(roleId);
        
        if (!role) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }
        
        if (role.tenantId !== tenantId) {
          return NextResponse.json(
            { error: 'Role not found' },
            { status: 404 }
          );
        }
        
        // Get the user's current roles
        const userRoles = await RoleService.getUserRoles(id, tenantId);
        
        // Check if the user has at least one other role
        if (userRoles.length <= 1 && userRoles.some(r => r.id === roleId)) {
          return NextResponse.json(
            { error: 'Cannot remove the last role from a user' },
            { status: 409 }
          );
        }
        
        // Remove the role from the user
        await RoleService.removeRoleFromUser(id, tenantId, roleId);
        
        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error(`Error removing role ${roleId} from user ${id}:`, error);
        
        return NextResponse.json(
          { error: error.message || 'Failed to remove role from user' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'manage:role' }
  )
);
