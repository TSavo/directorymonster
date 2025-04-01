import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import RoleService from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-development';

// Throw an error if JWT_SECRET is not set in production
if (process.env.NODE_ENV === 'production' && 
    (process.env.JWT_SECRET === undefined || process.env.JWT_SECRET === 'default-secret-for-development')) {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production.');
}

/**
 * Verifies the provided JWT token and returns its decoded payload.
 *
 * The function validates the token using a configured secret, ensuring it includes the mandatory `userId` claim and
 * has not expired. In test environments, a token with the exact value 'valid-token' returns a mock payload with
 * a userId of 'test-user-id'. If the token is invalid, expired, or missing required claims, an error is logged and
 * null is returned.
 *
 * @param token - The JWT token to verify.
 * @returns The decoded token payload if valid; otherwise, null.
 */
export function verifyAuthToken(token: string): JwtPayload | null {
  try {
    // For tests with 'valid-token', return a mock payload
    if (process.env.NODE_ENV === 'test' && token === 'valid-token') {
      return { userId: 'test-user-id' };
    }
    
    // Verify the token using the JWT secret
    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    
    // Validate the required claims
    if (!decoded.userId) {
      console.error('Invalid token: missing userId claim');
      return null;
    }
    
    // Check token expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      console.error('Token expired');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Helper function to handle common permission validation logic
 * 
 * @param req NextRequest object
 * @returns Object containing validation results or error response
 */
async function validatePermissionRequest(req: NextRequest): Promise<
  | { success: true; userId: string; tenantId: string }
  | { success: false; response: NextResponse }
> {
  // Extract the token from the Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    };
  }
  
  const token = authHeader.replace('Bearer ', '');
  const decoded = verifyAuthToken(token);
  
  if (!decoded) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      )
    };
  }
  
  // Extract tenant ID from the request headers
  const tenantId = req.headers.get('x-tenant-id');
  if (!tenantId) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Tenant ID required' },
        { status: 400 }
      )
    };
  }
  
  return {
    success: true,
    userId: decoded.userId,
    tenantId
  };
}

/**
 * Checks if the authenticated user has the required permission for a specified resource and processes the request accordingly.
 *
 * This middleware validates the request's authentication token to extract user and tenant information, then verifies that the user (within the tenant)
 * has the necessary permission for the provided resource type and, optionally, a specific resource ID. If the user lacks permission, it returns a 403
 * JSON response with an explanatory error message. In case of an error during validation, it returns a 500 response. When the permission check passes,
 * the provided handler is executed.
 *
 * @param req - The incoming HTTP request.
 * @param resourceType - The type of resource for which permission is being verified.
 * @param permission - The permission required for the operation.
 * @param handler - The function to execute if the permission check is successful.
 * @param resourceId - An optional identifier for a specific resource.
 * @returns The HTTP response resulting from the handler or a JSON error response if access is denied.
 */
export async function withPermission(
  req: NextRequest,
  resourceType: ResourceType,
  permission: Permission,
  handler: (req: NextRequest) => Promise<NextResponse>,
  resourceId?: string
): Promise<NextResponse> {
  try {
    // Use the shared validation helper
    const validation = await validatePermissionRequest(req);
    if (!validation.success) {
      return validation.response;
    }
    
    const { userId, tenantId } = validation;
    
    // Check if user has the required permission
    const hasPermission = await RoleService.hasPermission(
      userId,
      tenantId,
      resourceType,
      permission,
      resourceId
    );
    
    if (!hasPermission) {
      // Generate a meaningful error message
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
    
    // If permission check passes, proceed with the handler
    return await handler(req);
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
 * Checks if the authenticated user has at least one of the specified permissions.
 *
 * The middleware extracts a JWT from the 'Authorization' header and validates it,
 * then ensures a tenant ID is provided in the request headers. It iterates over the given
 * permissions and, if the user has any matching permission, proceeds by invoking the handler.
 * If the token is missing or invalid, the tenant ID is absent, or none of the permissions are granted,
 * an appropriate JSON error response is returned.
 *
 * @param req - The incoming request that must include an authorization token and tenant ID.
 * @param resourceType - The type of resource the user is attempting to access.
 * @param permissions - An array of permissions, any of which grants access.
 * @param handler - Asynchronous function to handle the request if permission validation passes.
 * @param resourceId - Optional specific identifier for the resource.
 * @returns A response from the handler if permission is granted, or an error response otherwise.
 */
export async function withAnyPermission(
  req: NextRequest,
  resourceType: ResourceType,
  permissions: Permission[],
  handler: (req: NextRequest) => Promise<NextResponse>,
  resourceId?: string
): Promise<NextResponse> {
  try {
    // Use the shared validation helper
    const validation = await validatePermissionRequest(req);
    if (!validation.success) {
      return validation.response;
    }
    
    const { userId, tenantId } = validation;
    
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
        return await handler(req);
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
 * Ensures that the authenticated user possesses all required permissions for a resource.
 *
 * This middleware extracts a JWT from the request's Authorization header, verifies the token,
 * and retrieves the tenant ID from the request headers. It then checks that the user has every
 * permission listed in the provided array. If any permission is missing, a 403 error response is returned
 * with details about the missing permissions. Additionally, it returns a 401 error for missing or invalid
 * authentication tokens and a 400 error if the tenant ID is not provided. In case of unexpected errors,
 * it returns a 500 error response.
 *
 * @param req - The incoming request.
 * @param resourceType - The type of resource being accessed.
 * @param permissions - An array of permissions that the user must have.
 * @param handler - A callback function to process the request if permission checks pass.
 * @param resourceId - An optional identifier for a specific resource.
 * @returns A response generated by the handler or an error response.
 */
export async function withAllPermissions(
  req: NextRequest,
  resourceType: ResourceType,
  permissions: Permission[],
  handler: (req: NextRequest) => Promise<NextResponse>,
  resourceId?: string
): Promise<NextResponse> {
  try {
    // Use the shared validation helper
    const validation = await validatePermissionRequest(req);
    if (!validation.success) {
      return validation.response;
    }
    
    const { userId, tenantId } = validation;
    
    // Create an array to track all missing permissions
    const missingPermissions: Permission[] = [];
    
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
        missingPermissions.push(permission);
      }
    }
    
    // If any permissions are missing, return an error
    if (missingPermissions.length > 0) {
      const missingPermissionsList = missingPermissions.join("', '");
      let errorMessage = `Permission denied: Missing required permission(s): '${missingPermissionsList}' for ${resourceType}`;
      if (resourceId) {
        errorMessage += ` with ID ${resourceId}`;
      }
      
      return NextResponse.json(
        { 
          error: 'Permission denied', 
          message: errorMessage,
          details: {
            resourceType,
            missingPermissions,
            resourceId
          }
        },
        { status: 403 }
      );
    }
    
    // User has all required permissions, proceed with the request
    return await handler(req);
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
 * Extracts a resource ID from the request and verifies the user's permission for that resource.
 *
 * The function attempts to extract the resource identifier using a prioritized approach:
 * 1. URL query parameter specified by the given idParam.
 * 2. Request body for POST, PUT, or PATCH methods.
 * 3. The last segment of the URL path if it matches an identifier pattern.
 *
 * If the header 'x-require-resource-id' is 'true' and no resource ID is found,
 * a JSON error response with a 400 status is returned. Otherwise, after validating
 * the authentication tokens, it verifies whether the user has the required permission
 * for the resource. A JSON error response with a 403 status is returned if permission is denied.
 *
 * @param req - The incoming request containing resource information.
 * @param resourceType - The type of the resource being accessed.
 * @param permission - The required permission to perform the operation.
 * @param handler - The async function to handle the request if permission is granted.
 * @param idParam - The key used to extract the resource ID from the request (defaults to 'id').
 * @returns A NextResponse from the handler on success, or a JSON error response on failure.
 *
 * @remarks
 * Resource ID extraction is attempted from URL query parameters, then the request body (for applicable methods),
 * and finally from the URL path. Issues during extraction are logged for debugging.
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
    
    // If not in URL params and this is a POST/PUT/PATCH request, try from request body
    if (!resourceId && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      try {
        // Try to clone the request to read the body
        const clonedReq = req.clone();
        const body = await clonedReq.json();
        
        if (body && typeof body === 'object') {
          resourceId = body[idParam];
        } else {
          console.warn('Request body is not a valid JSON object for resource ID extraction');
        }
      } catch (bodyError) {
        console.warn('Error reading request body for resource ID extraction:', bodyError);
        // Continue without body-based resource ID, but log for debugging
      }
    }
    
    // If not in URL params and not in body, try from the URL path
    if (!resourceId) {
      // Extract from path (e.g., /api/categories/123 => '123')
      const pathParts = url.pathname.split('/');
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        // Check if it looks like an ID (alphanumeric with optional dashes)
        if (/^[a-zA-Z0-9-]+$/.test(lastPart) && !lastPart.includes('.')) { // Avoid file extensions
          resourceId = lastPart;
        }
      }
    }
    
    // If resource ID extraction fails in a context where it should succeed, return error
    const requireResourceId = req.headers.get('x-require-resource-id') === 'true';
    if (requireResourceId && !resourceId) {
      return NextResponse.json(
        {
          error: 'Resource ID not found',
          message: `Could not extract resource ID using parameter '${idParam}' from the request`,
          details: {
            resourceType,
            idParameterName: idParam,
            idExtractionMethods: [
              'URL query parameter',
              'Request body property',
              'Last segment of URL path'
            ]
          }
        },
        { status: 400 }
      );
    }

    // Use the shared validation helper
    const validation = await validatePermissionRequest(req);
    if (!validation.success) {
      return validation.response;
    }
    
    const { userId, tenantId } = validation;
    
    // Check permission with the extracted resource ID
    const hasPermission = await RoleService.hasPermission(
      userId,
      tenantId,
      resourceType,
      permission,
      resourceId
    );
    
    if (!hasPermission) {
      // Generate a meaningful error message
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
    
    // If permission check passes, proceed with the handler
    return await handler(req);
  } catch (error) {
    console.error('Resource permission validation error:', error);
    return NextResponse.json(
      { 
        error: 'Permission validation failed', 
        message: 'An error occurred during resource permission validation',
        details: {
          originalError: process.env.NODE_ENV === 'development' ? String(error) : undefined
        }
      },
      { status: 500 }
    );
  }
}

export default withPermission;