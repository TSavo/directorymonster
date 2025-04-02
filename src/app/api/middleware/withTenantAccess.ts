import { NextRequest, NextResponse } from 'next/server';
import { decode, JwtPayload } from 'jsonwebtoken';
import RoleService from '@/lib/role-service';

/**
 * Middleware to validate tenant context in API requests
 * Ensures users only access resources in tenants they're members of
 *
 * @param req The Next.js request
 * @param handler The handler function to execute if validation passes
 * @returns Response from handler or error response
 */
export async function withTenantAccess(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get tenant ID from headers
    const tenantId = req.headers.get('x-tenant-id');

    // Get authentication token
    const authHeader = req.headers.get('authorization');

    // Validate tenant ID is provided
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant context', message: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Validate authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract token
    const token = authHeader.replace('Bearer ', '');

    // Decode token (without verification as that happens in the auth middleware)
    const decoded = decode(token) as JwtPayload;

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Authentication token is invalid' },
        { status: 401 }
      );
    }

    // Extract user ID
    const userId = decoded.userId;

    // Check if user has any role in this tenant
    const hasAccess = await RoleService.hasRoleInTenant(userId, tenantId);

    if (!hasAccess) {
      return NextResponse.json(
        {
          error: 'Access denied',
          message: 'You do not have access to this tenant'
        },
        { status: 403 }
      );
    }

    // If all checks pass, proceed to the handler
    return await handler(req);
  } catch (error) {
    console.error('Tenant validation error:', error);
    return NextResponse.json(
      {
        error: 'Tenant validation failed',
        message: 'An error occurred during tenant validation'
      },
      { status: 500 }
    );
  }
}

/**
 * Middleware to validate specific permission in a tenant context
 *
 * @param req The Next.js request
 * @param resourceType The type of resource being accessed
 * @param permission The permission required
 * @param handler The handler function to execute if validation passes
 * @returns Response from handler or error response
 */
export async function withPermission(
  req: NextRequest,
  resourceType: string,
  permission: string,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // First validate tenant access
    const tenantAccessResult = await withTenantAccess(req, async (validatedReq) => {
      // Get necessary information from the request
      const tenantId = validatedReq.headers.get('x-tenant-id') as string;
      const authHeader = validatedReq.headers.get('authorization') as string;

      // Extract token
      const token = authHeader.replace('Bearer ', '');

      // Decode token
      const decoded = decode(token) as JwtPayload;
      const userId = decoded.userId;

      // Get resource ID if specified in the URL or body
      let pathname;
      if ('pathname' in validatedReq) {
        // Use pathname property directly if available (for tests)
        pathname = validatedReq.pathname;
      } else {
        // Otherwise parse from URL
        const url = new URL(validatedReq.url);
        pathname = url.pathname;
      }

      // Extract the resource ID from the URL path
      // For URLs like /api/categories/cat-123, the ID is 'cat-123'
      const pathParts = pathname.split('/');
      const resourceId = pathParts.length > 0 ? pathParts[pathParts.length - 1] : undefined;

      // Check if user has the required permission
      const hasPermission = await RoleService.hasPermission(
        userId,
        tenantId,
        resourceType as any, // Type casting as any due to TypeScript constraints
        permission as any,
        resourceId
      );

      if (!hasPermission) {
        return NextResponse.json(
          {
            error: 'Permission denied',
            message: `You do not have ${permission} permission for ${resourceType}`
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
 * Middleware to add tenant context to request
 *
 * @param req The Next.js request
 * @param handler The handler function to execute
 * @returns Response from handler
 */
export async function withTenantContext(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get tenant ID from headers (already set by the Next.js middleware)
    const tenantId = req.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant context', message: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Clone the request to create a new headers object
    const newHeaders = new Headers(req.headers);

    // Add tenant context to the headers
    newHeaders.set('x-tenant-id', tenantId);

    // Create a new request with the updated headers
    const requestWithTenant = new NextRequest(req.url, {
      method: req.method,
      headers: newHeaders,
      body: req.body,
      redirect: req.redirect,
      signal: req.signal
    });

    // Proceed to the handler with the enhanced request
    return await handler(requestWithTenant);
  } catch (error) {
    console.error('Tenant context error:', error);
    return NextResponse.json(
      {
        error: 'Tenant context failed',
        message: 'An error occurred adding tenant context'
      },
      { status: 500 }
    );
  }
}
