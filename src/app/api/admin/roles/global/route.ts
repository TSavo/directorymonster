/**
 * API Route for managing global roles
 * 
 * GET    /api/admin/roles/global           - Get all global roles
 * POST   /api/admin/roles/global           - Create a new global role
 * GET    /api/admin/roles/global/:id       - Get a specific global role
 * PATCH  /api/admin/roles/global/:id       - Update a global role
 * DELETE /api/admin/roles/global/:id       - Delete a global role
 * GET    /api/admin/roles/global/:id/users - Get users with a global role
 */

import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '@/middleware/withPermission';
import { RoleService } from '@/lib/role-service';
import { AuditService } from '@/lib/audit/audit-service';
import { getTenantFromRequest } from '@/lib/tenant/tenant-resolver';
import { getUserFromRequest } from '@/lib/auth/user-resolver';

// Get all global roles
export async function GET(request: NextRequest) {
  return withPermission(
    request,
    'role',
    'read',
    async () => {
      try {
        const globalRoles = await RoleService.getGlobalRoles();
        return NextResponse.json(globalRoles);
      } catch (error) {
        console.error('Error getting global roles:', error);
        return NextResponse.json(
          { error: 'Failed to get global roles' },
          { status: 500 }
        );
      }
    }
  );
}

// Create a new global role
export async function POST(request: NextRequest) {
  return withPermission(
    request,
    'role',
    'create',
    async () => {
      try {
        const body = await request.json();
        
        // Ensure required fields are present
        if (!body.name || !Array.isArray(body.aclEntries)) {
          return NextResponse.json(
            { error: 'Name and aclEntries are required' },
            { status: 400 }
          );
        }
        
        // Create the global role
        const role = await RoleService.createGlobalRole({
          name: body.name,
          description: body.description || '',
          aclEntries: body.aclEntries
        });
        
        // Audit the action
        const user = await getUserFromRequest(request);
        await AuditService.logEvent({
          action: 'global_role_created',
          resourceType: 'role',
          resourceId: role.id,
          tenantId: 'system',
          userId: user?.id || 'unknown',
          details: {
            roleName: role.name
          }
        });
        
        return NextResponse.json(role);
      } catch (error) {
        console.error('Error creating global role:', error);
        return NextResponse.json(
          { error: 'Failed to create global role' },
          { status: 500 }
        );
      }
    }
  );
}

// Route handler for /api/admin/roles/global/:id
export async function GET_ROLE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(
    request,
    'role',
    'read',
    async () => {
      try {
        const roleId = params.id;
        const role = await RoleService.getGlobalRole(roleId);
        
        if (!role) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json(role);
      } catch (error) {
        console.error(`Error getting global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to get global role' },
          { status: 500 }
        );
      }
    }
  );
}

// Update a global role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(
    request,
    'role',
    'update',
    async () => {
      try {
        const roleId = params.id;
        const body = await request.json();
        
        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }
        
        // Update the role
        const role = await RoleService.updateRole('system', roleId, body);
        
        // Audit the action
        const user = await getUserFromRequest(request);
        await AuditService.logEvent({
          action: 'global_role_updated',
          resourceType: 'role',
          resourceId: roleId,
          tenantId: 'system',
          userId: user?.id || 'unknown',
          details: {
            roleName: existingRole.name,
            updates: Object.keys(body)
          }
        });
        
        return NextResponse.json(role);
      } catch (error) {
        console.error(`Error updating global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to update global role' },
          { status: 500 }
        );
      }
    }
  );
}

// Delete a global role
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(
    request,
    'role',
    'delete',
    async () => {
      try {
        const roleId = params.id;
        
        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }
        
        // Delete the role
        const success = await RoleService.deleteRole('system', roleId);
        
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to delete global role' },
            { status: 500 }
          );
        }
        
        // Audit the action
        const user = await getUserFromRequest(request);
        await AuditService.logEvent({
          action: 'global_role_deleted',
          resourceType: 'role',
          resourceId: roleId,
          tenantId: 'system',
          userId: user?.id || 'unknown',
          details: {
            roleName: existingRole.name
          }
        });
        
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error(`Error deleting global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to delete global role' },
          { status: 500 }
        );
      }
    }
  );
}

// Get users with a global role
export async function GET_USERS(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(
    request,
    'role',
    'read',
    async () => {
      try {
        const roleId = params.id;
        
        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }
        
        // Get users with this role
        const users = await RoleService.getUsersWithGlobalRole(roleId);
        
        return NextResponse.json(users);
      } catch (error) {
        console.error(`Error getting users with global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to get users with global role' },
          { status: 500 }
        );
      }
    }
  );
}

// Assign a global role to a user
export async function POST_ASSIGN(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(
    request,
    'role',
    'update',
    async () => {
      try {
        const roleId = params.id;
        const body = await request.json();
        
        // Ensure required fields are present
        if (!body.userId || !body.tenantId) {
          return NextResponse.json(
            { error: 'userId and tenantId are required' },
            { status: 400 }
          );
        }
        
        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }
        
        // Assign the role
        const success = await RoleService.assignRoleToUser(
          body.userId,
          body.tenantId,
          roleId
        );
        
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to assign global role' },
            { status: 500 }
          );
        }
        
        // Audit the action
        const user = await getUserFromRequest(request);
        await AuditService.logEvent({
          action: 'global_role_assigned',
          resourceType: 'user',
          resourceId: body.userId,
          tenantId: body.tenantId,
          userId: user?.id || 'unknown',
          details: {
            roleId,
            roleName: existingRole.name
          }
        });
        
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error(`Error assigning global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to assign global role' },
          { status: 500 }
        );
      }
    }
  );
}

// Remove a global role from a user
export async function POST_REMOVE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withPermission(
    request,
    'role',
    'update',
    async () => {
      try {
        const roleId = params.id;
        const body = await request.json();
        
        // Ensure required fields are present
        if (!body.userId || !body.tenantId) {
          return NextResponse.json(
            { error: 'userId and tenantId are required' },
            { status: 400 }
          );
        }
        
        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }
        
        // Remove the role
        const success = await RoleService.removeRoleFromUser(
          body.userId,
          body.tenantId,
          roleId
        );
        
        if (!success) {
          return NextResponse.json(
            { error: 'Failed to remove global role' },
            { status: 500 }
          );
        }
        
        // Audit the action
        const user = await getUserFromRequest(request);
        await AuditService.logEvent({
          action: 'global_role_removed',
          resourceType: 'user',
          resourceId: body.userId,
          tenantId: body.tenantId,
          userId: user?.id || 'unknown',
          details: {
            roleId,
            roleName: existingRole.name
          }
        });
        
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error(`Error removing global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to remove global role' },
          { status: 500 }
        );
      }
    }
  );
}
