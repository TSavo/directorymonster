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
 * Manually updates a user's notification settings and logs an audit event.
 *
 * This function extracts the tenant ID and user information from request headers, decodes the JWT token to retrieve
 * the user ID, and then attempts to update the user's settings (enabling notifications). It logs an audit event with
 * INFO severity on a successful update, including client details such as IP address and user agent. If an error occurs,
 * it logs an audit event with ERROR severity containing the error message and request URL, and returns a 500 error response.
 *
 * @returns A JSON response with the updated user settings on success or an error message on failure.
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

/**
 * Simulates updating a user's settings.
 *
 * This function mimics updating a user's settings in a database by returning a new object that merges the provided settings with a current timestamp.
 *
 * @param userId - The unique identifier of the user whose settings are being updated.
 * @param settings - An object containing the settings to update.
 * @returns A Promise that resolves to the updated settings object with an added "updatedAt" timestamp in ISO format.
 */
async function updateUserSettings(userId: string, settings: any): Promise<any> {
  // In a real application, this would update user settings in the database
  return { ...settings, updatedAt: new Date().toISOString() };
}

/**
 * Creates a new role for a tenant and logs the audit event for the role creation.
 *
 * This function checks the user's permission to create roles, extracts the tenant and user context from request headers and a JWT token,
 * and processes the provided role data to create a new role. After successfully creating the role, it logs an audit event with key details
 * such as the role name, whether the role is global, and the count of permissions. If any error occurs, it logs the error and returns a 500 response.
 *
 * @param req - The incoming HTTP request containing tenant and user authentication headers.
 * @returns A JSON response with the newly created role data or an error message if creation fails.
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

/**
 * Simulates creating a role.
 *
 * This function generates a new role object by augmenting the provided role data with a unique identifier and a creation timestamp.
 * In a real application, this function would insert the new role into a database.
 *
 * @param roleData - An object containing the properties of the role.
 * @returns A role object containing the provided properties, a unique id, and the creation timestamp.
 */

async function createRole(roleData: any): Promise<any> {
  // In a real application, this would create a role in the database
  return {
    id: 'role-' + Math.random().toString(36).substring(2, 9),
    ...roleData,
    createdAt: new Date().toISOString()
  };
}

/**

 * Processes a tenant membership change by adding a user to a tenant and logging the event.
 *
 * This function validates that the requester has permission to manage tenant actions. It extracts the tenant ID
 * and admin user ID from the request headers and JWT token, parses the target user's ID and role from the request body,
 * adds the user to the tenant, and logs the membership event with details such as the initial role and inviter.
 * On success, it returns a JSON response indicating the operation succeeded; on failure, it logs the error and returns
 * a JSON response with a 500 status code.
 *
 * @param req - The incoming HTTP request with tenant context, authorization header, and membership details in the JSON body.
 * @returns A response object containing a JSON message indicating success or failure of the tenant membership update.

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

/**
 * Simulates adding a user to a tenant by logging the addition.
 *
 * In a production environment, this function would perform a database operation to add the user to the specified tenant with the designated role.
 *
 * @param userId - The unique identifier of the user to be added.
 * @param tenantId - The unique identifier of the tenant.
 * @param roleId - The unique identifier of the role assigned to the user within the tenant.
 */

async function addUserToTenant(userId: string, tenantId: string, roleId: string): Promise<void> {
  // In a real application, this would add the user to the tenant
  console.log(`Added user ${userId} to tenant ${tenantId} with role ${roleId}`);
}

/**
 * Retrieves audit logs for the admin dashboard with optional filtering.
 *
 * This function enforces audit read permissions and extracts tenant and user context from the request headers. It decodes the JWT token to obtain the user ID and checks if the user is a global admin, which determines whether logs from all tenants can be accessed. The function supports optional query parameters for filtering by startDate, endDate, action, and resourceType, and allows pagination using limit and offset. After querying the audit events via the audit service, it logs the audit access event and returns a JSON response containing the retrieved logs. In case of an error, it logs the error details and returns a JSON response with a 500 status code.
 *
 * @returns A JSON response containing the audit events on success, or an error message with a 500 status on failure.
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


/**
 * Simulated global admin check.
 *
 * Determines whether the specified user ID corresponds to a global administrator.
 * This simulation returns true only if the user ID is exactly 'admin-user-id'.
 *
 * @param userId - The identifier of the user to check.
 * @returns A promise that resolves to true if the user is a global admin, false otherwise.
 */

async function isUserGlobalAdmin(userId: string): Promise<boolean> {
  // In a real application, this would check if the user has global admin roles
  return userId === 'admin-user-id';
}

/**
 * Detects and handles cross-tenant access requests.
 *
 * This function extracts tenant identifiers from both the request headers and URL query parameters to determine if a user is attempting to access a resource from a tenant different than their own. It then verifies whether the user has cross-tenant access permissions. Unauthorized attempts are logged via the audit service and result in a 403 JSON response. If the tenant IDs match or the user is authorized, the function returns a success response. In the event of an error during processing, the function logs the error and responds with a 500 JSON error.
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


/**
 * Simulates verifying whether a user has permissions for cross-tenant access.
 *
 * This function is a simulated check that always returns false, indicating that no user
 * has cross-tenant access in this example.
 *
 * @param userId - The identifier of the user to check.
 * @returns A promise that resolves to false.
 */

async function userHasCrossTenantAccess(userId: string): Promise<boolean> {
  // In a real application, this would check if user has cross-tenant permissions
  return false;
}
