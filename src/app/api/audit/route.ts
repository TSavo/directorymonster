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
 * GET handler for retrieving audit logs
 * Requires 'read' permission on 'audit' resource type
 * 
 * Query parameters:
 * - action: Filter by specific action
 * - severity: Filter by severity level
 * - userId: Filter by user ID
 * - resourceType: Filter by resource type
 * - resourceId: Filter by resource ID
 * - startDate: Filter by start date (ISO string)
 * - endDate: Filter by end date (ISO string)
 * - limit: Maximum number of results to return
 * - offset: Offset for pagination
 * - success: Filter by success status (true/false)
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
 * POST handler for manually creating audit events
 * Requires 'create' permission on 'audit' resource type
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
