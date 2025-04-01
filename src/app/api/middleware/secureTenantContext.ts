import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';
import RoleService from '@/lib/role-service';
import { ResourceType, Permission, detectCrossTenantAccess } from '@/components/admin/auth/utils/accessControl';
import AuditService from '@/lib/audit/audit-service';
import { AuditAction } from '@/lib/audit/types';
import TenantMembershipService from '@/lib/tenant-membership-service';

// JWT secret should be stored in environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set in production.');
}
const JWT_SECRET = process.env.JWT_SECRET;

/**
 * TenantContext class for encapsulating tenant context information
 * with security measures to prevent unauthorized tenant access
 */
export class TenantContext {
  readonly tenantId: string;
  readonly userId: string;
  readonly requestId: string;
  readonly timestamp: number;
  
  /**
   * Creates a new tenant context with security metadata
   * 
   * @param tenantId The tenant ID
   * @param userId The user ID
   */
  constructor(tenantId: string, userId: string) {
    this.tenantId = tenantId;
    this.userId = userId;
    this.requestId = uuidv4(); // Generate unique request ID for audit trail
    this.timestamp = Date.now(); // Timestamp for request tracing
  }
  
  /**
   * Creates a tenant context from request headers
   * 
   * @param req The Next.js request
   * @returns A new TenantContext instance or null if validation fails
   */
  static async fromRequest(req: NextRequest): Promise<TenantContext | null> {
    try {
      // Get tenant ID from headers
      const tenantId = req.headers.get('x-tenant-id');
      
      // Get authentication token
      const authHeader = req.headers.get('authorization');
      
      // Validate tenant ID and auth token
      if (!tenantId || !authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
      }
      
      // Validate tenant ID is a valid UUID
      if (!validateUuid(tenantId)) {
        console.error('Invalid tenant ID format:', tenantId);
        return null;
      }
      
      // Extract and verify token
      const token = authHeader.replace('Bearer ', '');
      let decoded: JwtPayload;
      
      try {
        decoded = verify(token, JWT_SECRET) as JwtPayload;
        if (!decoded || !decoded.userId) {
          return null;
        }
      } catch (error) {
        console.error('Token verification error:', error);
        return null;
      }
      
      const userId = decoded.userId;
      
      // Verify user is a member of the tenant
      const isMember = await TenantMembershipService.isTenantMember(userId, tenantId);
      if (!isMember) {
        console.error(`User ${userId} is not a member of tenant ${tenantId}`);
        
        // Log unauthorized tenant access attempt
        await AuditService.logSecurityEvent(
          userId,
          tenantId,
          AuditAction.UNAUTHORIZED_TENANT_ACCESS,
          {
            method: req.method,
            url: req.url
          }
        );
        
        return null;
      }
      
      // Create tenant context
      return new TenantContext(tenantId, userId);
    } catch (error) {
      console.error('Error creating tenant context:', error);
      return null;
    }
  }
}

/**
 * Middleware for securely validating tenant context with additional security checks
 * Part of the Cross-Tenant Attack Prevention (Issue #58)
 * 
 * @param req The Next.js request
 * @param handler The request handler function
 * @returns A Next.js response
 */
export async function withSecureTenantContext(
  req: NextRequest,
  handler: (req: NextRequest, context: TenantContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Create secure tenant context from request
    const context = await TenantContext.fromRequest(req);
    
    if (!context) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'Invalid tenant context'
        },
        { status: 401 }
      );
    }
    
    // Check for tenant ID mismatch in URL
    const url = new URL(req.url);
    const tenantIdParam = url.searchParams.get('tenantId');
    
    if (tenantIdParam && tenantIdParam !== context.tenantId) {
      // Log cross-tenant access attempt
      await AuditService.logSecurityEvent(
        context.userId,
        context.tenantId,
        AuditAction.CROSS_TENANT_ACCESS_ATTEMPT,
        {
          requestId: context.requestId,
          method: req.method,
          url: req.url,
          targetTenantId: tenantIdParam
        }
      );
      
      return NextResponse.json(
        {
          error: 'Cross-tenant access denied',
          message: 'Cannot access resources from another tenant',
          requestId: context.requestId
        },
        { status: 403 }
      );
    }
    
    // Check for tenant ID patterns in path segments
    const pathSegments = url.pathname.split('/');
    for (const segment of pathSegments) {
      // Check if segment looks like a UUID and doesn't match current tenant
      if (validateUuid(segment) && segment !== context.tenantId) {
        await AuditService.logSecurityEvent(
          context.userId,
          context.tenantId,
          AuditAction.CROSS_TENANT_ACCESS_ATTEMPT,
          {
            requestId: context.requestId,
            method: req.method,
            url: req.url,
            suspiciousPathSegment: segment
          }
        );
        
        return NextResponse.json(
          {
            error: 'Cross-tenant access denied',
            message: 'Cannot access resources from another tenant',
            requestId: context.requestId
          },
          { status: 403 }
        );
      }
    }
    
    // Forward to handler with validated context
    return handler(req, context);
  } catch (error) {
    console.error('Error in withSecureTenantContext middleware:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request'
      },
      { status: 500 }
    );
  }
}

/**
 * Middleware for combining tenant context validation with permission checks
 * Part of the Cross-Tenant Attack Prevention (Issue #58)
 * Implements defense in depth through multiple security layers
 * 
 * @param req The Next.js request
 * @param resourceType The resource type to check permission for
 * @param permission The permission to check
 * @param handler The request handler function
 * @param resourceId Optional specific resource ID
 * @returns A Next.js response
 */
export async function withSecureTenantPermission(
  req: NextRequest,
  resourceType: ResourceType,
  permission: Permission,
  handler: (req: NextRequest, context: TenantContext) => Promise<NextResponse>,
  resourceId?: string
): Promise<NextResponse> {
  return withSecureTenantContext(req, async (req, context) => {
    try {
      // Check if user has the required permission
      const hasPermission = await RoleService.hasPermission(
        context.userId,
        context.tenantId,
        resourceType,
        permission,
        resourceId
      );
      
      if (!hasPermission) {
        // Log permission denied
        await AuditService.logSecurityEvent(
          context.userId,
          context.tenantId,
          AuditAction.PERMISSION_DENIED,
          {
            requestId: context.requestId,
            resourceType,
            permission,
            resourceId
          }
        );
        
        return NextResponse.json(
          {
            error: 'Permission denied',
            message: `You do not have ${permission} permission for ${resourceType}`,
            requestId: context.requestId,
            details: {
              resourceType,
              permission,
              resourceId
            }
          },
          { status: 403 }
        );
      }
      
      // Check for cross-tenant resource references in request body
      if (req.method === 'POST' || req.method === 'PUT') {
        try {
          const clonedReq = req.clone();
          const body = await clonedReq.json();
          
          // Check if ACL contains references to other tenants
          if (body.acl && detectCrossTenantAccess(body.acl, context.tenantId)) {
            // Log cross-tenant access attempt via ACL
            await AuditService.logSecurityEvent(
              context.userId,
              context.tenantId,
              AuditAction.CROSS_TENANT_ACCESS_ATTEMPT,
              {
                requestId: context.requestId,
                method: req.method,
                url: req.url,
                details: 'ACL contains cross-tenant references'
              }
            );
            
            return NextResponse.json(
              {
                error: 'Cross-tenant access denied',
                message: 'ACL contains references to resources in another tenant',
                requestId: context.requestId
              },
              { status: 403 }
            );
          }
          
          // Check other parts of the request body for tenant IDs
          // This is a simplified example - real implementation would be more thorough
          function findTenantIdReferences(obj: any, path: string = ''): string[] {
            if (!obj || typeof obj !== 'object') return [];
            
            const references: string[] = [];
            
            for (const [key, value] of Object.entries(obj)) {
              // Skip the already checked ACL
              if (key === 'acl') continue;
              
              const currentPath = path ? `${path}.${key}` : key;
              
              // Check if property is named tenantId or ends with TenantId
              if ((key === 'tenantId' || key.endsWith('TenantId')) && 
                  typeof value === 'string' && 
                  value !== context.tenantId && 
                  value !== 'system' && 
                  validateUuid(value)) {
                references.push(`${currentPath}: ${value}`);
              }
              
              // Recurse into nested objects and arrays
              if (typeof value === 'object') {
                references.push(...findTenantIdReferences(value, currentPath));
              }
            }
            
            return references;
          }
          
          const tenantReferences = findTenantIdReferences(body);
          
          if (tenantReferences.length > 0) {
            // Log cross-tenant access attempt
            await AuditService.logSecurityEvent(
              context.userId,
              context.tenantId,
              AuditAction.CROSS_TENANT_ACCESS_ATTEMPT,
              {
                requestId: context.requestId,
                method: req.method,
                url: req.url,
                tenantReferences
              }
            );
            
            return NextResponse.json(
              {
                error: 'Cross-tenant access denied',
                message: 'Request body contains references to resources in another tenant',
                requestId: context.requestId,
                details: { tenantReferences }
              },
              { status: 403 }
            );
          }
        } catch (bodyError) {
          // This is not a critical error for this middleware
          // Just means we couldn't parse the body as JSON
          console.log('Could not check request body:', bodyError);
        }
      }
      
      // Forward to handler if all checks pass
      return handler(req, context);
    } catch (error) {
      console.error('Error in withSecureTenantPermission middleware:', error);
      
      return NextResponse.json(
        { 
          error: 'Internal Server Error',
          message: 'An error occurred while processing your request'
        },
        { status: 500 }
      );
    }
  });
}

/**
 * Extracts the user ID from a JWT token in the authorization header
 * 
 * @param req The Next.js request
 * @returns The user ID or null if not found
 */
function extractUserIdFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    return decoded.userId || null;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}