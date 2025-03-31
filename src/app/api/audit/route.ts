import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import { withPermission } from '../middleware/withPermission';
import AuditService from '@/lib/audit/audit-service';
import { AuditAction, AuditSeverity } from '@/lib/audit/types';
import RoleService from '@/lib/role-service';
import { ResourceType } from '@/components/admin/auth/utils/accessControl';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-development';

/**
 * Handles GET requests for retrieving audit logs.
 *
 * This endpoint enforces 'read' permission on the 'audit' resource and processes query parameters to filter audit events.
 * It extracts tenant information and verifies JWT authentication to determine the requesting user's identity and global admin status.
 * Supported query parameters include:
 * - action: One or multiple audit actions to filter by (comma-separated for multiple values).
 * - severity: One or multiple severity levels to filter by (comma-separated for multiple values).
 * - userId: Filters events by the specified user ID.
 * - resourceType: Filters events by the type of resource.
 * - resourceId: Filters events by the specific resource identifier.
 * - startDate: ISO-formatted start date for filtering events.
 * - endDate: ISO-formatted end date for filtering events.
 * - limit: Maximum number of results to return (default is 50, maximum allowed is 1000).
 * - offset: Pagination offset (default is 0).
 * - success: Boolean flag to filter events by their success status.
 *
 * Global administrators can retrieve events across all tenants.
 * On success, returns a JSON response with an `events` property containing the audit logs.
 * In case of an error, returns a JSON error message with a 500 status code.
 *
 * @returns A {@link NextResponse} object with a JSON payload containing the queried audit events.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withPermission(
    req,
    'audit', // Now properly defined in ResourceType
    'read',
    async (validatedReq) => {
      try {
        // Get tenant context and user info
        const tenantId = validatedReq.headers.get('x-tenant-id') as string;
        const authHeader = validatedReq.headers.get('authorization') as string;
        const token = authHeader.replace('Bearer ', '');
        const decoded = verify(token, JWT_SECRET) as JwtPayload;
        const userId = decoded.userId;
        
        // Parse query parameters
        const url = new URL(validatedReq.url);
        const actionParam = url.searchParams.get('action');
        const severityParam = url.searchParams.get('severity');
        const userIdParam = url.searchParams.get('userId');
        const resourceTypeParam = url.searchParams.get('resourceType');
        const resourceIdParam = url.searchParams.get('resourceId');
        const startDateParam = url.searchParams.get('startDate');
        const endDateParam = url.searchParams.get('endDate');
        const limitParam = url.searchParams.get('limit');
        const offsetParam = url.searchParams.get('offset');
        const successParam = url.searchParams.get('success');
        

        // Validate date parameters
        if (startDateParam && !isValidISOString(startDateParam)) {
          return NextResponse.json(
            { error: 'Invalid startDate format. Use ISO date string.' },
            { status: 400 }
          );
        }
        
        if (endDateParam && !isValidISOString(endDateParam)) {
          return NextResponse.json(
            { error: 'Invalid endDate format. Use ISO date string.' },
            { status: 400 }
          );
        }
        

        // Check if user is a global admin (can see cross-tenant events)
        const isGlobalAdmin = await RoleService.hasGlobalRole(userId);
        
        // Map string parameters to typed values
        const action = actionParam ? 
          (actionParam.includes(',') ? 
            actionParam.split(',').map(a => a as AuditAction) : 
            actionParam as AuditAction) : 
          undefined;
        
        const severity = severityParam ? 
          (severityParam.includes(',') ? 
            severityParam.split(',').map(s => s as AuditSeverity) : 
            severityParam as AuditSeverity) : 
          undefined;
        
        const success = successParam !== null ? 
          successParam === 'true' : 
          undefined;
        
        // Validate and apply limits for pagination to prevent unbounded queries
        const parsedLimit = limitParam ? parseInt(limitParam, 10) : 50;
        const limit = isNaN(parsedLimit) ? 50 : Math.min(parsedLimit, 1000); // Maximum 1000 results
        
        const parsedOffset = offsetParam ? parseInt(offsetParam, 10) : 0;
        const offset = isNaN(parsedOffset) ? 0 : Math.max(parsedOffset, 0); // Non-negative offset
        
        // Build query object
        const query = {
          tenantId: isGlobalAdmin ? undefined : tenantId, // Global admins can see all tenants
          userId: userIdParam || undefined,
          action,
          severity,
          resourceType: resourceTypeParam as ResourceType || undefined,
          resourceId: resourceIdParam || undefined,
          startDate: startDateParam || undefined,
          endDate: endDateParam || undefined,
          limit,
          offset,
          success
        };
        
        // Query events
        const events = await AuditService.queryEvents(
          query,
          tenantId,
          isGlobalAdmin
        );
        
        return NextResponse.json({ events });
      } catch (error) {
        console.error('Error retrieving audit logs:', error);
        return NextResponse.json(
          { error: 'Error retrieving audit logs' },
          { status: 500 }
        );
      }
    }
  );
}

/**
 * Handles POST requests to create a new audit event.
 *
 * This handler verifies that the request has the required "create" permission on the audit resource,
 * extracts tenant and user information from the request headers and JWT token, and processes the JSON payload
 * to log an audit event. It ensures that the required "action" field is present and, for non-global-admin users,
 * enforces tenant isolation by preventing the creation of events for tenants other than the current tenant.
 *
 * Returns a 400 response if the JSON payload is invalid or the "action" field is missing, a 403 response if tenant isolation is violated,
 * and a 500 response if an unexpected error occurs.
 *
 * @param req - The incoming HTTP request.
 * @returns A NextResponse containing the created audit event or an error message.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withPermission(
    req,
    'audit',
    'create',
    async (validatedReq) => {
      try {
        // Get tenant context and user info
        const tenantId = validatedReq.headers.get('x-tenant-id') as string;
        const authHeader = validatedReq.headers.get('authorization') as string;
        const token = authHeader.replace('Bearer ', '');
        const decoded = verify(token, JWT_SECRET) as JwtPayload;
        const userId = decoded.userId;
        
        // Parse request body
        let body;
        try {
          body = await validatedReq.json();
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          );
        }
        
        // Validate required fields
        if (!body.action) {
          return NextResponse.json(
            { error: 'Missing required field: action' },
            { status: 400 }
          );
        }
        

        // Validate resourceType if provided
        if (body.resourceType && !Object.values(ResourceType).includes(body.resourceType)) {
          return NextResponse.json(
            { error: 'Invalid resourceType value' },
            { status: 400 }
          );
        }
        
        // Validate severity if provided
        if (body.severity && !Object.values(AuditSeverity).includes(body.severity)) {
          return NextResponse.json(
            { error: 'Invalid severity value' },
            { status: 400 }
          );
        }
        

        // Check if user is a global admin (can create cross-tenant events)
        const isGlobalAdmin = await RoleService.hasGlobalRole(userId);
        
        // Enforce tenant isolation unless user is global admin
        if (!isGlobalAdmin && body.tenantId && body.tenantId !== tenantId) {
          return NextResponse.json(
            { error: 'Cannot create audit events for other tenants' },
            { status: 403 }
          );
        }
        
        // Create the audit event
        const event = await AuditService.logEvent({
          userId: body.userId || userId, // Default to current user
          tenantId: body.tenantId || tenantId, // Default to current tenant
          action: body.action,
          resourceType: body.resourceType,
          resourceId: body.resourceId,
          severity: body.severity,
          details: body.details || {},
          success: body.success !== undefined ? body.success : true
        });
        
        return NextResponse.json({ event });
      } catch (error) {
        console.error('Error creating audit event:', error);
        return NextResponse.json(
          { error: 'Error creating audit event' },
          { status: 500 }
        );
      }
    }
  );
}


function isValidISOString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
  return regex.test(dateString);
}
