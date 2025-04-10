import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { getRole, getRoleUsers, addUsersToRole, removeUserFromRole } from '@/lib/role/role-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/roles/[id]/users
 * 
 * Get users assigned to a specific role
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response with the role users
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
      
      // Ensure the role belongs to the current tenant
      const role = await getRole(id, tenantId);
      
      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      
      // Get query parameters
      const url = new URL(req.url);
      const searchParams = url.searchParams;
      
      // Build filter from query parameters
      const filter = {
        search: searchParams.get('search') || undefined,
        page: searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1,
        limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10
      };
      
      const { users, pagination, availableUsers } = await getRoleUsers(id, tenantId, filter);
      
      return NextResponse.json({ users, pagination, availableUsers });
    } catch (error) {
      console.error('Error fetching role users:', error);
      return NextResponse.json(
        { error: 'Failed to fetch role users' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'read' }
);

/**
 * POST /api/admin/roles/[id]/users
 * 
 * Add users to a specific role
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
      
      // Ensure the role belongs to the current tenant
      const role = await getRole(id, tenantId);
      
      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      
      const data = await req.json();
      const userIds = data.userIds as string[];
      
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return NextResponse.json(
          { error: 'Invalid user IDs format' },
          { status: 400 }
        );
      }
      
      await addUsersToRole(id, tenantId, userIds);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error adding users to role:', error);
      return NextResponse.json(
        { error: 'Failed to add users to role' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'update' }
);

/**
 * DELETE /api/admin/roles/[id]/users/[userId]
 * 
 * Remove a user from a specific role
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
      const role = await getRole(id, tenantId);
      
      if (!role) {
        return NextResponse.json(
          { error: 'Role not found' },
          { status: 404 }
        );
      }
      
      // Get user ID from query parameters
      const url = new URL(req.url);
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required' },
          { status: 400 }
        );
      }
      
      await removeUserFromRole(id, tenantId, userId);
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error removing user from role:', error);
      return NextResponse.json(
        { error: 'Failed to remove user from role' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'update' }
);
