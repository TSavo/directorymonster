/**
 * Enhanced withPermission middleware
 * 
 * Provides authorization middleware for API routes that require specific permissions.
 * Implements section 3.2 of the MULTI_TENANT_ACL_SPEC.md.
 */

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import TenantMembershipService from '@/lib/tenant-membership-service';
import RoleService from '@/lib/role-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';
import { withTenantAccess } from './tenant-validation';

/**
 * Extract and validate JWT token from authorization header
 * @param authHeader Authorization header
 * @returns Decoded token or null if invalid
 */
function verifyAuthToken(authHeader: string | null): { userId: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    // Handle both direct jwt and jwt.default for testing compatibility
    const jwtVerify = typeof jwt.verify === 'function' ? jwt.verify : jwt.default?.verify;
    if (!jwtVerify) {
      throw new Error('JWT verify function not available');
    }
    return jwtVerify(token, process.env.JWT_SECRET!) as { userId: string };
  } catch (error) {
    console.error('Invalid auth token:', error);
    return null;
  }
}

/**
 * Middleware to check if user has the required permission in the current tenant context
 * 
 * This middleware builds on the tenant validation middleware to enforce specific permissions.
 * 
 * @param req NextRequest object
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
  // First validate tenant context and membership using withTenantAccess
  return withTenantAccess(req, async () => {
    const tenantId = req.headers.get('x-tenant-id');
    const authHeader = req.headers.get('authorization');
    
    if (!tenantId || !authHeader) {
      return NextResponse.json(
        { error: 'Missing tenant context or authentication' }, 
        { status: 401 }
      );
    }
    
    // Extract user ID from auth token
    const decoded = verifyAuthToken(authHeader);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' }, 
        { status: 401 }
      );
    }
    
    // Check if user has the required permission
    const hasPermission = await RoleService.hasPermission(
      decoded.userId,
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
      
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }
    
    // User has the required permission, proceed with the request
    return handler(req);
  });
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
  return withTenantAccess(req, async () => {
    const tenantId = req.headers.get('x-tenant-id');
    const authHeader = req.headers.get('authorization');
    
    if (!tenantId || !authHeader) {
      return NextResponse.json(
        { error: 'Missing tenant context or authentication' }, 
        { status: 401 }
      );
    }
    
    // Extract user ID from auth token
    const decoded = verifyAuthToken(authHeader);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' }, 
        { status: 401 }
      );
    }
    
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
        return handler(req);
      }
    }
    
    // User doesn't have any of the required permissions
    const permissionList = permissions.join("', '");
    let errorMessage = `Permission denied: Required one of '${permissionList}' permissions for ${resourceType}`;
    if (resourceId) {
      errorMessage += ` with ID ${resourceId}`;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 403 });
  });
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
  return withTenantAccess(req, async () => {
    const tenantId = req.headers.get('x-tenant-id');
    const authHeader = req.headers.get('authorization');
    
    if (!tenantId || !authHeader) {
      return NextResponse.json(
        { error: 'Missing tenant context or authentication' }, 
        { status: 401 }
      );
    }
    
    // Extract user ID from auth token
    const decoded = verifyAuthToken(authHeader);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired authentication token' }, 
        { status: 401 }
      );
    }
    
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
        // Missing at least one required permission
        let errorMessage = `Permission denied: Required '${permission}' permission for ${resourceType}`;
        if (resourceId) {
          errorMessage += ` with ID ${resourceId}`;
        }
        
        return NextResponse.json({ error: errorMessage }, { status: 403 });
      }
    }
    
    // User has all required permissions, proceed with the request
    return handler(req);
  });
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
 * @param idParam Parameter name for the resource ID in the URL
 * @returns NextResponse object
 */
export async function withResourcePermission(
  req: NextRequest,
  resourceType: ResourceType,
  permission: Permission,
  handler: (req: NextRequest) => Promise<NextResponse>,
  idParam: string = 'id'
): Promise<NextResponse> {
  // Extract resource ID from URL or request body
  let resourceId: string | undefined;
  
  try {
    // Try to get from URL first
    const url = new URL(req.url);
    resourceId = url.searchParams.get(idParam) || undefined;
    
    // If not in URL and this is a POST/PUT request, try body
    if (!resourceId && (req.method === 'POST' || req.method === 'PUT')) {
      const body = await req.json();
      resourceId = body[idParam];
    }
  } catch (error) {
    console.error('Error extracting resource ID:', error);
  }
  
  // Use the standard withPermission middleware with the extracted resource ID
  return withPermission(req, resourceType, permission, handler, resourceId);
}

export default withPermission;
