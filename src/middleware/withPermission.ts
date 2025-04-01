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
 * Verifies a JWT token and returns its decoded payload.
 *
 * The function validates the provided token using the configured secret by ensuring that it contains a mandatory
 * `userId` claim and has not expired. If the token is invalid, missing required claims, or expired, an error is logged
 * and the function returns null.
 *
 * @param token - The JWT token to verify.
 * @returns The decoded token payload if valid, otherwise null.
 */
export function verifyAuthToken(token: string): JwtPayload | null {
  try {
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
 * Middleware to handle API-level permission checks
 * 
 * @param req NextRequest object
 * @param resourceType Type of resource being accessed
 * @param permission Permission needed for the operation
 * @param handler Function to handle the request if permission check passes
 * @param resourceId Optional specific resource ID
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
        decoded.userId,
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
        decoded.userId,
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
 * This middleware attempts to retrieve the resource identifier by checking, in order:
 * - The query parameter specified by `idParam` in the URL.
 * - The request body for `POST`, `PUT`, or `PATCH` methods.
 * - The last segment of the URL path if it resembles an identifier.
 *
 * If the request includes the header `x-require-resource-id` set to 'true' and no resource ID is extracted,
 * it returns a JSON error response with a 400 status. Otherwise, it delegates to the standard permission middleware
 * by invoking `withPermission` with the extracted resource ID.
 *
 * @param req - The incoming request from which the resource ID is extracted.
 * @param resourceType - The type of resource being accessed.
 * @param permission - The permission required to perform the requested operation.
 * @param handler - The async function to handle the request if the permission check succeeds.
 * @param idParam - The key used to extract the resource ID from the request (default is 'id').
 * @returns A NextResponse from the handler if permission is granted, or a JSON error response otherwise.
 *
 * @remarks
 * Resource ID extraction prioritizes URL query parameters, then the request body (for applicable methods),
 * and finally the URL path. Any issues encountered during extraction are logged for debugging purposes.
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
