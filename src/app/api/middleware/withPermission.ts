import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import RoleService from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { withTenantAccess } from './withTenantAccess';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-development';

/**
 * Extracts the user ID from the JWT in the request's authorization header.
 *
 * This function retrieves the authorization header from the provided request,
 * removes the 'Bearer ' prefix from the token, and verifies the token using the supplied secret.
 * If the token is valid and contains a user ID, that ID is returned; otherwise, null is returned.
 *
 * @param req - The NextRequest containing the authorization header.
 * @param secret - The JWT secret used for verifying the token.
 * @returns The user ID extracted from the decoded token, or null if the token is missing or invalid.
 */
function extractUserIdFromRequest(req: NextRequest, secret: string): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return null;
  }
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = verify(token, secret) as JwtPayload;
    return decoded.userId || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Middleware to enforce that a user has a specific permission in a multi-tenant context.
 *
 * This function verifies tenant access and extracts the user ID from the request's JWT token.
 * If the user ID is missing or the user does not hold the required permission for the given
 * resource type (and optional resource ID), it returns a 403 response with an informative error message.
 * Otherwise, it proceeds to invoke the provided handler function.
 *
 * @param req - The Next.js request.
 * @param resourceType - The type of resource being accessed.
 * @param permission - The required permission for the operation.
 * @param handler - Asynchronous function to handle the request if permission is granted.
 * @param resourceId - Optional specific resource ID for granular permission checks.
 * @returns A NextResponse object representing either the permission error response or the handler's result.
 *
 * @remarks Returns a 500 response if an internal error occurs during permission validation.
 */
export async function withPermission(
  req: NextRequest,
  resourceType: ResourceType,
  permission: Permission,
  handler: (req: NextRequest) => Promise<NextResponse>,
  resourceId?: string
): Promise<NextResponse> {
  try {
    // First validate tenant access using the existing middleware
    const tenantAccessResult = await withTenantAccess(req, async (validatedReq) => {
      // Get necessary information from the request
      const tenantId = validatedReq.headers.get('x-tenant-id') as string;
      const userId = extractUserIdFromRequest(validatedReq, JWT_SECRET);
      
      if (!userId) {
        return NextResponse.json(
          { 
            error: 'Permission denied', 
            message: 'User ID not found in token',
            details: {
              resourceType,
              permission,
              resourceId
            }
          },
          { status: 403 }
        );
      }
      
      // Check if user has the required permission
      const hasPermission = await RoleService.hasPermission(
        userId,
        tenantId,
        resourceType,
        permission,
        resourceId
      );
      
      if (!hasPermission) {
        // Generate a meaningful error message based on the resource and permission
        let errorMessage = `Permission denied: Required '${permission}' permission for ${resourceType}`;
        if (resourceId) {
          errorMessage += ` with ID ${resourceId}`;
        }
        
        return NextResponse.json(
          { 
            error: 'Permission denied', 
            message: errorMessage,
            details: {
              resourceType,
              permission,
              resourceId
            }
          },
          { status: 403 }
        );
      }
      
      // If permission check passes, proceed to the handler
      return await handler(validatedReq);
    });
    
    // Return the result (either from the permission check or the handler)
    return tenantAccessResult;
  } catch (error) {
    console.error('Permission validation error:', error);
    return NextResponse.json(
      { 
        error: 'Permission validation failed', 
        message: 'An error occurred during permission validation' 
      },
      { status: 500 }
    );
  }
}

/**
 * Validates that the current user has at least one of the specified permissions for a resource within a tenant context.
 *
 * This middleware first confirms tenant access and extracts the user ID from the JWT token present in the request.
 * It then iterates over the provided permissions and, if the user holds any one of them, delegates request handling
 * to the given callback. If the user ID is missing or none of the permissions are granted, it returns a 403 response
 * with an appropriate error message. In the event of an unexpected error during validation, a 500 response is returned.
 *
 * @param req The incoming request object.
 * @param resourceType The type of resource being accessed.
 * @param permissions An array of permissions; access is allowed if the user possesses any one of them.
 * @param handler The function to execute if the permission check passes.
 * @param resourceId An optional identifier for more granular permission checks.
 * @returns A response object representing either the outcome of the handler function or an error response.
 */
export async function withAnyPermission(
  req: NextRequest,
  resourceType: ResourceType,
  permissions: Permission[],
  handler: (req: NextRequest) => Promise<NextResponse>,
  resourceId?: string
): Promise<NextResponse> {
  try {
    // First validate tenant access
    const tenantAccessResult = await withTenantAccess(req, async (validatedReq) => {
      const tenantId = validatedReq.headers.get('x-tenant-id') as string;
      const userId = extractUserIdFromRequest(validatedReq, JWT_SECRET);
      
      if (!userId) {
        return NextResponse.json(
          { 
            error: 'Permission denied', 
            message: 'User ID not found in token',
            details: {
              resourceType,
              permissions,
              resourceId
            }
          },
          { status: 403 }
        );
      }
      
      // Check each permission
      for (const permission of permissions) {
        const hasPermission = await RoleService.hasPermission(
          userId,
          tenantId,
          resourceType,
          permission,
          resourceId
        );
        
        if (hasPermission) {
          // User has at least one required permission, proceed with the request
          return await handler(validatedReq);
        }
      }
      
      // User doesn't have any of the required permissions
      const permissionList = permissions.join("', '");
      let errorMessage = `Permission denied: Required one of '${permissionList}' permissions for ${resourceType}`;
      if (resourceId) {
        errorMessage += ` with ID ${resourceId}`;
      }
      
      return NextResponse.json(
        { 
          error: 'Permission denied', 
          message: errorMessage,
          details: {
            resourceType,
            permissions,
            resourceId
          }
        }, 
        { status: 403 }
      );
    });
    
    // Return the result
    return tenantAccessResult;
  } catch (error) {
    console.error('Permission validation error:', error);
    return NextResponse.json(
      { 
        error: 'Permission validation failed', 
        message: 'An error occurred during permission validation' 
      },
      { status: 500 }
    );
  }
}

/**
 * Verifies that the authenticated user holds every required permission for a specified resource.
 *
 * This middleware first validates tenant access and extracts the user ID from the JWT token in the request.
 * It then checks that the user possesses each permission in the provided array for the given resource type,
 * optionally scoping the check to a specific resource ID. If the user ID is missing or if any permission is not found,
 * a 403 error response is returned. In the event of an internal error during validation, a 500 error response is provided.
 *
 * @param req - The NextRequest object containing authentication and tenant headers.
 * @param resourceType - The category of resource for which permissions are being validated.
 * @param permissions - An array of required permissions that must all be held by the user.
 * @param handler - The asynchronous function to execute if permission checks pass.
 * @param resourceId - Optional identifier for a specific resource to narrow the permission check.
 * @returns The NextResponse from the handler upon successful permission validation, or an error response if validation fails.
 */
export async function withAllPermissions(
  req: NextRequest,
  resourceType: ResourceType,
  permissions: Permission[],
  handler: (req: NextRequest) => Promise<NextResponse>,
  resourceId?: string
): Promise<NextResponse> {
  try {
    // First validate tenant access
    const tenantAccessResult = await withTenantAccess(req, async (validatedReq) => {
      const tenantId = validatedReq.headers.get('x-tenant-id') as string;
      const userId = extractUserIdFromRequest(validatedReq, JWT_SECRET);
      
      if (!userId) {
        return NextResponse.json(
          { 
            error: 'Permission denied', 
            message: 'User ID not found in token',
            details: {
              resourceType,
              permissions,
              resourceId
            }
          },
          { status: 403 }
        );
      }
      
      // Check each permission
      for (const permission of permissions) {
        const hasPermission = await RoleService.hasPermission(
          userId,
          tenantId,
          resourceType,
          permission,
          resourceId
        );
        
        if (!hasPermission) {
          // Missing at least one required permission
          let errorMessage = `Permission denied: Required '${permission}' permission for ${resourceType}`;
          if (resourceId) {
            errorMessage += ` with ID ${resourceId}`;
          }
          
          return NextResponse.json(
            { 
              error: 'Permission denied', 
              message: errorMessage,
              details: {
                resourceType,
                missingPermission: permission,
                resourceId
              }
            }, 
            { status: 403 }
          );
        }
      }
      
      // User has all required permissions, proceed with the request
      return await handler(validatedReq);
    });
    
    // Return the result
    return tenantAccessResult;
  } catch (error) {
    console.error('Permission validation error:', error);
    return NextResponse.json(
      { 
        error: 'Permission validation failed', 
        message: 'An error occurred during permission validation' 
      },
      { status: 500 }
    );
  }
}

/**
 * Extracts a resource ID from the request and verifies that the user has the required permission for that resource.
 *
 * This middleware attempts to locate the resource ID in the URL query parameters, the request body (for POST/PUT requests),
 * or the URL path. It then delegates the permission check to the standard permission middleware using the extracted ID.
 * If any error occurs during extraction or permission verification, it logs the error and returns a JSON error response with a 500 status.
 *
 * @param req - The Next.js request object.
 * @param resourceType - The type of resource being accessed.
 * @param permission - The permission required to perform the operation.
 * @param handler - The function to handle the request if the permission check succeeds.
 * @param idParam - The name of the parameter that holds the resource ID (default is 'id').
 * @returns The response from the permission check or an error response if validation fails.
 */
export async function withResourcePermission(
  req: NextRequest,
  resourceType: ResourceType,
  permission: Permission,
  handler: (req: NextRequest) => Promise<NextResponse>,
  idParam: string = 'id'
): Promise<NextResponse> {
  try {
    // First try to get resource ID from URL params
    let resourceId: string | undefined;
    const url = new URL(req.url);
    resourceId = url.searchParams.get(idParam) || undefined;
    
    // If not in URL params and this is a POST/PUT request, try from request body
    if (!resourceId && (req.method === 'POST' || req.method === 'PUT')) {
      try {
        // Try to clone the request to read the body
        const clonedReq = req.clone();
        const body = await clonedReq.json();
        resourceId = body[idParam];
      } catch (bodyError) {
        console.error('Error reading request body:', bodyError);
      }
    }
    
    // If not in URL params and not in body, try from the URL path
    if (!resourceId) {
      // Extract from path (e.g., /api/categories/123 => '123')
      const pathParts = url.pathname.split('/');
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        // Check if it looks like an ID (alphanumeric with optional dashes)
        if (/^[a-zA-Z0-9-]+$/.test(lastPart)) {
          resourceId = lastPart;
        }
      }
    }
    
    // Now use the standard withPermission middleware with the extracted resource ID
    return withPermission(req, resourceType, permission, handler, resourceId);
  } catch (error) {
    console.error('Resource permission validation error:', error);
    return NextResponse.json(
      { 
        error: 'Permission validation failed', 
        message: 'An error occurred during resource permission validation' 
      },
      { status: 500 }
    );
  }
}

/**
 * Checks for the required permission and logs an audit event for both successful and denied access attempts.
 *
 * This middleware wraps a standard permission check. When the permission is granted, it logs a successful access event
 * including details such as the permission, request method, and URL path. If the check results in a 403 (permission denied),
 * it logs a corresponding denied event. In both cases, if audit logging fails, the middleware logs the error and proceeds
 * with handling the request.
 *
 * @param req - Incoming NextRequest.
 * @param resourceType - Category of the resource being accessed.
 * @param permission - Permission required to access the resource.
 * @param handler - Callback function to process the request if the permission check passes.
 * @param resourceId - Optional identifier for a specific resource.
 * @returns The NextResponse from the permission check or the handler.
 */
export async function withAuditedPermission(
  req: NextRequest,
  resourceType: ResourceType,
  permission: Permission,
  handler: (req: NextRequest) => Promise<NextResponse>,
  resourceId?: string
): Promise<NextResponse> {
  // First check permission normally
  const result = await withPermission(req, resourceType, permission, async (validatedReq) => {
    try {
      // Permission check passed, log the successful access
      const tenantId = validatedReq.headers.get('x-tenant-id') as string;
      const userId = extractUserIdFromRequest(validatedReq, JWT_SECRET);
      
      if (!userId) {
        console.error('Failed to extract user ID for audit logging');
        // Still proceed with the handler even if audit logging fails
        return await handler(validatedReq);
      }
      
      // Log successful permission access
      await logAuditEvent({
        userId,
        tenantId,
        action: 'access',
        resourceType,
        resourceId,
        details: {
          permission,
          method: req.method,
          path: new URL(req.url).pathname
        }
      });
      
      // Proceed with the handler
      return await handler(validatedReq);
    } catch (error) {
      console.error('Error in audited permission middleware:', error);
      // Still proceed with the handler even if audit logging fails
      return await handler(validatedReq);
    }
  });
  
  // Check if permission was denied
  if (result.status === 403) {
    try {
      // Get user and tenant info
      const tenantId = req.headers.get('x-tenant-id');
      const userId = extractUserIdFromRequest(req, JWT_SECRET);
      
      if (tenantId && userId) {
        // Log permission denied event
        await logAuditEvent({
          userId,
          tenantId,
          action: 'denied',
          resourceType,
          resourceId,
          details: {
            permission,
            method: req.method,
            path: new URL(req.url).pathname
          }
        });
      }
    } catch (error) {
      console.error('Error logging permission denial:', error);
    }
  }
  
  return result;
}

/**
 * Logs an audit event for permission-related actions.
 *
 * This function logs the provided audit event details to the console as a JSON string.
 * It serves as a placeholder implementation and will be replaced with an actual audit logging
 * system as part of the ACL Audit Trail improvement (refer to Issue #55).
 *
 * @param event - Object containing audit event properties:
 *   - userId: Identifier of the user performing the action.
 *   - tenantId: Identifier of the tenant.
 *   - action: Description of the action taken.
 *   - resourceType: The type of resource involved.
 *   - resourceId (optional): Identifier of the specific resource, when relevant.
 *   - details: Additional contextual information for the audit.
 */
async function logAuditEvent(event: {
  userId: string;
  tenantId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, any>;
}): Promise<void> {
  // This is a placeholder for the actual audit logging implementation
  // It will be implemented as part of Issue #55: Implement ACL Audit Trail System
  console.log('Audit event:', JSON.stringify(event));
}

export default withPermission;
