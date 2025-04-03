import { NextResponse } from 'next/server';
import { getUserFromSession } from '@/lib/auth';
import { db } from '@/lib/db';
import TenantMembershipService from '@/lib/tenant-membership-service';

interface AssignUserRequest {
  userId: string;
  tenantId: string;
  roleId: string;
}

/**
 * POST endpoint for assigning a user to a tenant with a specific role.
 * 
 * This endpoint:
 * 1. Verifies the current user has permission to manage users
 * 2. Validates the input data
 * 3. Assigns the user to the specified tenant with the specified role
 * 4. Returns success or error response
 */
export async function POST(request: Request) {
  try {
    // Get current user from session for authorization
    const currentUser = await getUserFromSession();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user has permission to manage users
    if (!currentUser.acl.entries.some(entry => 
      entry.resource.type === 'user' && 
      entry.permission === 'create'
    )) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json() as AssignUserRequest;
    
    if (!body.userId || !body.tenantId || !body.roleId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, tenantId, roleId' },
        { status: 400 }
      );
    }
    
    // Check if tenant exists
    const tenant = await db.tenant.findUnique({
      where: { id: body.tenantId }
    });
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: body.userId }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if role exists
    const role = await db.role.findFirst({
      where: { 
        id: body.roleId,
        tenantId: body.tenantId
      }
    });
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found or does not belong to the specified tenant' },
        { status: 404 }
      );
    }
    
    // Check if current user has permission to assign this specific role
    // This provides additional security for tenant isolation
    const hasPermission = currentUser.acl.entries.some(entry => 
      entry.resource.type === 'role' && 
      entry.permission === 'assign' && 
      (
        !entry.resource.tenantId || // Global permission
        entry.resource.tenantId === body.tenantId // Tenant-specific permission
      )
    );
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied - cannot assign roles in this tenant' },
        { status: 403 }
      );
    }
    
    // Add user to tenant with the specified role
    const success = await TenantMembershipService.addUserToTenant(
      body.userId,
      body.tenantId,
      body.roleId
    );
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to assign user to tenant' },
        { status: 500 }
      );
    }
    
    // Update user's siteIds array to include the new tenant
    await db.user.update({
      where: { id: body.userId },
      data: {
        siteIds: {
          push: body.tenantId
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'User successfully assigned to tenant'
    });
  } catch (error) {
    console.error('Error assigning user to tenant:', error);
    return NextResponse.json(
      { error: 'Failed to assign user to tenant' },
      { status: 500 }
    );
  }
}
