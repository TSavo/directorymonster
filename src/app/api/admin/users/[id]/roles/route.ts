import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '@/middleware/withRedis';
import { withAuth } from '@/middleware/withAuth';
import { RoleService } from '@/lib/role/role-service';
import { UserService } from '@/lib/user/user-service';

/**
 * GET handler for retrieving roles assigned to a user
 * 
 * @param request The incoming request
 * @param params The route parameters (id)
 * @returns JSON response with the user's roles
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
        
        // Verify the user exists
        const user = await UserService.getUser(id);
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Get the user's roles for this tenant
        const roles = await RoleService.getUserRoles(id, tenantId);
        
        return NextResponse.json(roles);
      } catch (error: any) {
        console.error(`Error retrieving roles for user ${id}:`, error);
        
        return NextResponse.json(
          { error: error.message || 'Failed to retrieve user roles' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'read:role' }
  )
);

/**
 * POST handler for assigning roles to a user
 * 
 * @param request The incoming request
 * @param params The route parameters (id)
 * @returns JSON response with success message
 */
export const POST = withRedis(
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
        
        // Verify the user exists
        const user = await UserService.getUser(id);
        
        if (!user) {
          return NextResponse.json(
            { error: 'User not found' },
            { status: 404 }
          );
        }
        
        // Parse request body
        const data = await request.json();
        
        // Validate required fields
        if (!Array.isArray(data.roleIds) || data.roleIds.length === 0) {
          return NextResponse.json(
            { error: 'At least one role ID is required' },
            { status: 400 }
          );
        }
        
        // Verify all roles exist and belong to the tenant
        for (const roleId of data.roleIds) {
          const role = await RoleService.getRole(roleId);
          
          if (!role) {
            return NextResponse.json(
              { error: `Role ${roleId} not found` },
              { status: 404 }
            );
          }
          
          if (role.tenantId !== tenantId) {
            return NextResponse.json(
              { error: `Role ${roleId} not found` },
              { status: 404 }
            );
          }
        }
        
        // Assign roles to the user
        await RoleService.assignRolesToUser(id, tenantId, data.roleIds);
        
        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error(`Error assigning roles to user ${id}:`, error);
        
        return NextResponse.json(
          { error: error.message || 'Failed to assign roles to user' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'manage:role' }
  )
);
