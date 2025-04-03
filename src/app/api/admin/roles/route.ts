import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '@/middleware/withRedis';
import { withAuth } from '@/middleware/withAuth';
import { RoleService } from '@/lib/role/role-service';

/**
 * GET handler for retrieving roles
 * 
 * @param request The incoming request
 * @returns JSON response with roles
 */
export const GET = withRedis(
  withAuth(
    async (request: NextRequest) => {
      try {
        // Get query parameters
        const url = new URL(request.url);
        const type = url.searchParams.get('type');
        const scope = url.searchParams.get('scope');
        const sort = url.searchParams.get('sort') || 'name';
        const order = url.searchParams.get('order') || 'asc';
        
        // Get the tenant ID from the auth object (set by withAuth middleware)
        const tenantId = (request as any).auth?.tenantId;
        
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Tenant ID is required' },
            { status: 400 }
          );
        }
        
        // Get roles for the tenant
        const roles = await RoleService.getRoles(tenantId);
        
        // Apply filters
        let filteredRoles = [...roles];
        
        if (type) {
          filteredRoles = filteredRoles.filter(role => role.type === type);
        }
        
        if (scope) {
          filteredRoles = filteredRoles.filter(role => role.scope === scope);
        }
        
        // Sort roles
        filteredRoles.sort((a, b) => {
          const aValue = a[sort as keyof typeof a];
          const bValue = b[sort as keyof typeof b];
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return order === 'asc'
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return order === 'asc'
              ? aValue - bValue
              : bValue - aValue;
          }
          
          return 0;
        });
        
        // Get user counts for each role
        const rolesWithUserCounts = await Promise.all(
          filteredRoles.map(async (role) => {
            const userCount = await RoleService.getRoleUserCount(role.id);
            
            return {
              ...role,
              userCount,
              canModify: role.type !== 'system'
            };
          })
        );
        
        return NextResponse.json({ roles: rolesWithUserCounts });
      } catch (error: any) {
        console.error('Error retrieving roles:', error);
        
        return NextResponse.json(
          { error: error.message || 'Failed to retrieve roles' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'read:role' }
  )
);

/**
 * POST handler for creating a new role
 * 
 * @param request The incoming request
 * @returns JSON response with the created role
 */
export const POST = withRedis(
  withAuth(
    async (request: NextRequest) => {
      try {
        // Get the tenant ID from the auth object (set by withAuth middleware)
        const tenantId = (request as any).auth?.tenantId;
        
        if (!tenantId) {
          return NextResponse.json(
            { error: 'Tenant ID is required' },
            { status: 400 }
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
        
        // Create the role
        const role = await RoleService.createRole({
          name: data.name,
          description: data.description,
          tenantId,
          isGlobal: data.isGlobal || false,
          type: 'custom',
          scope: data.scope || 'tenant',
          aclEntries: data.permissions.map((permission: any) => ({
            resource: {
              type: permission.resource,
              tenantId,
              siteId: permission.siteId
            },
            permission: permission.action
          }))
        });
        
        return NextResponse.json(role, { status: 201 });
      } catch (error: any) {
        console.error('Error creating role:', error);
        
        if (error.message === 'Role with this name already exists') {
          return NextResponse.json(
            { error: error.message },
            { status: 409 }
          );
        }
        
        return NextResponse.json(
          { error: error.message || 'Failed to create role' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'manage:role' }
  )
);
