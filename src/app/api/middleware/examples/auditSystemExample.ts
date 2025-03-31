import { NextRequest, NextResponse } from 'next/server';
import { withPermission, withAuditedPermission } from '../withPermission';
import AuditService from '@/lib/audit/audit-service';
import { AuditAction, AuditSeverity } from '@/lib/audit/types';
import { decode } from 'jsonwebtoken';

/**
 * ACL Audit Trail System Usage Examples
 * 
 * This file demonstrates different ways to use the audit trail system
 * implemented for Issue #55.
 */

/**
 * Example 1: Using withAuditedPermission middleware
 * 
 * This automatically logs permission check events (both successful and failed)
 * and is the simplest way to integrate audit logging.
 */
export async function exampleWithAuditedPermission(req: NextRequest): Promise<NextResponse> {
  return withAuditedPermission(
    req,
    'user',
    'read',
    async (validatedReq) => {
      // Business logic here - all permission checks are automatically logged
      return NextResponse.json({ success: true });
    },
    'user-123' // Optional resource ID
  );
}

/**
 * Example 2: Manual audit logging for custom events
 * 
 * Use this approach for non-permission events like user login/logout,
 * settings changes, or other security-relevant actions.
 */
export async function exampleManualAuditLogging(req: NextRequest): Promise<NextResponse> {
  try {
    // Get tenant and user context
    const tenantId = req.headers.get('x-tenant-id') as string;
    const authHeader = req.headers.get('authorization') as string;
    const token = authHeader.replace('Bearer ', '');
    const decoded = decode(token) as any;
    const userId = decoded.userId;
    
    // Extract client information for better audit context
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent');
    
    // Perform operation
    const userSettings = await updateUserSettings(userId, { notifications: true });
    
    // Log the audit event
    await AuditService.logEvent({
      userId,
      tenantId,
      action: AuditAction.SETTINGS_CHANGED,
      severity: AuditSeverity.INFO,
      resourceType: 'user',
      resourceId: userId,
      ipAddress: ipAddress as string,
      userAgent: userAgent as string,
      details: {
        settingName: 'notifications',
        oldValue: false,
        newValue: true
      },
      success: true
    });
    
    return NextResponse.json({ settings: userSettings });
  } catch (error) {
    console.error('Settings update failed:', error);
    
    // Log failure audit event
    const tenantId = req.headers.get('x-tenant-id') as string;
    const authHeader = req.headers.get('authorization') as string;
    
    if (tenantId && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = decode(token) as any;
      
      if (decoded?.userId) {
        await AuditService.logEvent({
          userId: decoded.userId,
          tenantId,
          action: AuditAction.SETTINGS_CHANGED,
          severity: AuditSeverity.ERROR,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error',
            request: req.url
          },
          success: false
        });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// Simulated business logic
async function updateUserSettings(userId: string, settings: any): Promise<any> {
  // In a real application, this would update user settings in the database
  return { ...settings, updatedAt: new Date().toISOString() };
}

/**
 * Example 3: Audit logging for role management
 * 
 * Use the specialized helper methods for common operations
 */
export async function exampleRoleManagement(req: NextRequest): Promise<NextResponse> {
  return withPermission(
    req,
    'role',
    'create',
    async (validatedReq) => {
      try {
        // Get tenant and user context
        const tenantId = validatedReq.headers.get('x-tenant-id') as string;
        const authHeader = validatedReq.headers.get('authorization') as string;
        const token = authHeader.replace('Bearer ', '');
        const decoded = decode(token) as any;
        const userId = decoded.userId;
        
        // Create the role (business logic)
        const body = await validatedReq.json();
        const newRole = await createRole({
          name: body.name,
          description: body.description,
          tenantId,
          isGlobal: body.isGlobal || false,
          permissions: body.permissions
        });
        
        // Log the role creation event
        await AuditService.logRoleEvent(
          userId,
          tenantId,
          AuditAction.ROLE_CREATED,
          newRole.id,
          {
            roleName: newRole.name,
            isGlobal: newRole.isGlobal,
            permissionCount: newRole.permissions?.length || 0
          }
        );
        
        return NextResponse.json({ role: newRole });
      } catch (error) {
        console.error('Role creation failed:', error);
        return NextResponse.json(
          { error: 'Failed to create role' },
          { status: 500 }
        );
      }
    }
  );
}

// Simulated role creation
async function createRole(roleData: any): Promise<any> {
  // In a real application, this would create a role in the database
  return {
    id: 'role-' + Math.random().toString(36).substring(2, 9),
    ...roleData,
    createdAt: new Date().toISOString()
  };
}

/**
 * Example 4: Audit logging for tenant membership changes
 */
export async function exampleTenantMembership(req: NextRequest): Promise<NextResponse> {
  return withPermission(
    req,
    'tenant',
    'manage',
    async (validatedReq) => {
      try {
        // Get tenant and user context
        const tenantId = validatedReq.headers.get('x-tenant-id') as string;
        const authHeader = validatedReq.headers.get('authorization') as string;
        const token = authHeader.replace('Bearer ', '');
        const decoded = decode(token) as any;
        const adminUserId = decoded.userId;
        
        // Get user to add to tenant from request
        const body = await validatedReq.json();
        const targetUserId = body.userId;
        
        // Add user to tenant (business logic)
        await addUserToTenant(targetUserId, tenantId, body.roleId);
        
        // Log the tenant membership event
        await AuditService.logTenantMembershipEvent(
          adminUserId,
          tenantId,
          targetUserId,
          AuditAction.USER_ADDED_TO_TENANT,
          {
            initialRoleId: body.roleId,
            invitedBy: adminUserId
          }
        );
        
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error('Add user to tenant failed:', error);
        return NextResponse.json(
          { error: 'Failed to add user to tenant' },
          { status: 500 }
        );
      }
    }
  );
}

// Simulated user tenant addition
async function addUserToTenant(userId: string, tenantId: string, roleId: string): Promise<void> {
  // In a real application, this would add the user to the tenant
  console.log(`Added user ${userId} to tenant ${tenantId} with role ${roleId}`);
}

/**
 * Example 5: Retrieving audit logs for admin dashboard
 */
export async function exampleRetrieveAuditLogs(req: NextRequest): Promise<NextResponse> {
  return withPermission(
    req,
    'audit',
    'read',
    async (validatedReq) => {
      try {
        // Get tenant and user context
        const tenantId = validatedReq.headers.get('x-tenant-id') as string;
        const authHeader = validatedReq.headers.get('authorization') as string;
        const token = authHeader.replace('Bearer ', '');
        const decoded = decode(token) as any;
        const userId = decoded.userId;
        
        // Check if user is global admin (for cross-tenant view)
        const isGlobalAdmin = await isUserGlobalAdmin(userId);
        
        // Parse query parameters
        const url = new URL(validatedReq.url);
        const startDate = url.searchParams.get('startDate') || undefined;
        const endDate = url.searchParams.get('endDate') || undefined;
        const action = url.searchParams.get('action') || undefined;
        const resourceType = url.searchParams.get('resourceType') || undefined;
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit') as string) : 50;
        const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset') as string) : 0;
        
        // Query audit events
        const auditEvents = await AuditService.queryEvents(
          {
            tenantId: isGlobalAdmin ? undefined : tenantId,  // Global admins can see all tenants
            startDate,
            endDate,
            action: action as any,
            resourceType: resourceType as any,
            limit,
            offset
          },
          tenantId,
          isGlobalAdmin
        );
        
        // Log this audit view event itself
        await AuditService.logEvent({
          userId,
          tenantId,
          action: AuditAction.ACCESS_GRANTED,
          resourceType: 'audit',
          details: {
            queryParams: {
              startDate,
              endDate,
              action,
              resourceType,
              limit,
              offset
            },
            resultCount: auditEvents.length
          },
          success: true
        });
        
        return NextResponse.json({ events: auditEvents });
      } catch (error) {
        console.error('Retrieving audit logs failed:', error);
        return NextResponse.json(
          { error: 'Failed to retrieve audit logs' },
          { status: 500 }
        );
      }
    }
  );
}

// Simulated global admin check
async function isUserGlobalAdmin(userId: string): Promise<boolean> {
  // In a real application, this would check if the user has global admin roles
  return userId === 'admin-user-id';
}

/**
 * Example 6: Cross-tenant access attempt detection
 */
export async function exampleCrossTenantAttempt(req: NextRequest): Promise<NextResponse> {
  try {
    // Get tenant context from the request
    const requestedTenantId = req.headers.get('x-tenant-id') as string;
    const authHeader = req.headers.get('authorization') as string;
    const token = authHeader.replace('Bearer ', '');
    const decoded = decode(token) as any;
    const userId = decoded.userId;
    
    // Get tenant from the requested resource
    const url = new URL(req.url);
    const resourceTenantId = url.searchParams.get('tenantId') as string;
    
    // If attempting to access a different tenant's resource
    if (resourceTenantId && resourceTenantId !== requestedTenantId) {
      // Check if user has cross-tenant access
      const hasAccess = await userHasCrossTenantAccess(userId);
      
      if (!hasAccess) {
        // Log the cross-tenant access attempt
        await AuditService.logCrossTenantAccessAttempt(
          userId,
          requestedTenantId,
          resourceTenantId,
          {
            method: req.method,
            path: url.pathname,
            ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
          }
        );
        
        return NextResponse.json(
          { error: 'Cross-tenant access denied' },
          { status: 403 }
        );
      }
    }
    
    // Continue with normal request handling
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Simulated cross-tenant access check
async function userHasCrossTenantAccess(userId: string): Promise<boolean> {
  // In a real application, this would check if user has cross-tenant permissions
  return false;
}
