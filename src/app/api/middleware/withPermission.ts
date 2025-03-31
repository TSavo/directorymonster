import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import RoleService from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { withTenantAccess } from './withTenantAccess';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-development';

/**
 * Helper function to extract user ID from a request's authorization header
 * Centralizes token parsing and verification logic
 * 
 * @param req NextRequest object containing the authorization header
 * @param secret JWT secret for token verification
 * @returns User ID from the token or null if invalid/missing
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
 * Enhanced middleware to check if user has the required permission in tenant context
 * Implements section 3.2 of the MULTI_TENANT_ACL_SPEC.md
 * 
 * @param req The Next.js request
 * @param resourceType Type of resource being accessed
 * @param permission Permission needed for the operation
 * @param handler Function to handle the request if permission check passes
 * @param resourceId Optional specific resource ID for granular permissions
 * @returns NextResponse object
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
 * Middleware to check if user has any of the specified permissions
 * 
 * @param req NextRequest object
 * @param resourceType Type of resource being accessed
 * @param permissions Array of permissions, any one of which grants access
 * @param handler Function to handle the request if permission check passes
 * @param resourceId Optional specific resource ID for granular permissions
 * @returns NextResponse object
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
 * Middleware to check if user has all specified permissions
 * 
 * @param req NextRequest object
 * @param resourceType Type of resource being accessed
 * @param permissions Array of permissions, all of which are required
 * @param handler Function to handle the request if permission check passes
 * @param resourceId Optional specific resource ID for granular permissions
 * @returns NextResponse object
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
 * Middleware to check permission based on resource ID from the request
 * 
 * Extracts resourceId from the URL or request body and checks permission for that specific resource.
 * 
 * @param req NextRequest object
 * @param resourceType Type of resource being accessed
 * @param permission Permission needed for the operation
 * @param handler Function to handle the request if permission check passes
 * @param idParam Parameter name for the resource ID in the URL or request body
 * @returns NextResponse object
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
 * Middleware to add audit logging for permission-related events
 * 
 * @param req NextRequest object
 * @param resourceType Type of resource being accessed
 * @param permission Permission being checked
 * @param handler Function to handle the request if permission check passes
 * @param resourceId Optional specific resource ID
 * @returns NextResponse object
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
 * Helper function to log audit events
 * Placeholder implementation - will be replaced with actual audit logger
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
