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
import withPermission from '@/middleware/withPermission';
import RoleService from '@/lib/role-service';
import AuditService from '@/lib/audit/audit-service';
import { getTenantFromRequest } from '@/lib/tenant/tenant-resolver';
import { getUserFromRequest } from '@/lib/auth/user-resolver';

/**
 * Retrieves all global roles.
 *
 * Checks that the request has the appropriate read permissions before retrieving the global roles.
 * If permission is granted, it returns a JSON response containing the list of roles.
 * On error, logs the issue and responds with an error message and a 500 status.
 */
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

/**
 * Creates a new global role.
 *
 * Validates the JSON request body to ensure that the required `name` and `aclEntries`
 * fields are provided. If validation passes, a new global role is created and an audit
 * event is logged. The function returns the created role in a JSON response. It responds
 * with a 400 error if required fields are missing and a 500 error if an error occurs during
 * role creation.
 *
 * Uses a permission check to verify that the requester is authorized to create roles.
 *
 * @returns A JSON response containing the created role or an error message with the appropriate HTTP status.
 */
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

/**
 * Retrieves a global role by its ID after verifying read permissions.
 *
 * This handler checks if the requester is allowed to access role data. It attempts to fetch a global role
 * using the provided role identifier. If the role exists, it returns the role data as a JSON response; if not,
 * it responds with a 404 error. Any unexpected error results in a 500 response, with the error logged to the console.
 *
 * @param request - The incoming HTTP request.
 * @param params - An object containing route parameters.
 * @param params.id - The unique identifier of the global role.
 *
 * @returns A JSON response with either the global role data or an error message.
 */
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

/**
 * Updates a global role.
 *
 * This function checks for the appropriate permissions and attempts to update the global role identified
 * by the ID provided in the request parameters. The update details are extracted from the JSON body of the request.
 * If the role does not exist, it returns a 404 response. On success, the updated role is returned as JSON, and the action
 * is audited. Any processing errors result in a 500 response.
 *
 * @param request - The HTTP request containing the role update details in its JSON body.
 * @param params.id - The unique identifier of the global role to update.
 * @returns A JSON response containing the updated global role or an error message.
 */
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

/**
 * Deletes a global role identified by its unique ID.
 *
 * This handler verifies that the specified global role exists and that the requester has
 * the necessary permissions to delete it. If the role is not found, it responds with a 404 error.
 * On a successful deletion, it logs the action via the audit service and returns a confirmation response.
 * If the deletion fails, a 500 error response is returned.
 *
 * @param request - The HTTP request object.
 * @param params - An object containing route parameters; the `id` property represents the global role's unique identifier.
 * @returns A JSON response indicating success or the appropriate error response.
 */
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

/**
 * Retrieves users associated with a specified global role.
 *
 * This function verifies that the global role exists for the provided role identifier.
 * If the role is found, it returns a JSON response containing the users assigned to that role.
 * If the role does not exist, a 404 response is returned.
 * On unexpected errors, it logs the error and returns a 500 response.
 *
 * @param params.id - The unique identifier of the global role.
 *
 * @returns A JSON response with the list of users, or an error message if the role is not found or an error occurs.
 */
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

/**
 * Assigns a global role to a user.
 *
 * This function validates that the request JSON body contains the required fields "userId" and "tenantId", and verifies the existence of the global role specified by the URL parameter "id". If the role exists, it attempts to assign the role to the user and logs the operation via an audit service. Depending on the outcome, it returns a JSON response indicating success or an error with an appropriate HTTP status code.
 *
 * @param request - The incoming HTTP request.
 * @param params - An object containing the URL parameter.
 * @param params.id - The unique identifier of the global role to be assigned.
 * @returns A JSON response indicating whether the assignment was successful or describing the error encountered.
 */
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

/**
 * Removes a global role from a user.
 *
 * This endpoint verifies that the request includes the required "userId" and "tenantId" fields, checks that the global role exists (using the role ID from the URL parameters), and attempts to remove the role from the specified user. On successful removal, it records an audit log. If any step fails, an appropriate error response is returned.
 *
 * @remarks
 * A permission check is performed to ensure the caller has update access for roles. The JSON response will have a 400 status if required fields are missing, a 404 if the role is not found, or a 500 if an error occurs during the removal process.
 *
 * @returns A JSON response indicating success or detailing the error encountered.
 */
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
