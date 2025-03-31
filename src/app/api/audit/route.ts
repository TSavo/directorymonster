import { NextRequest, NextResponse } from 'next/server';
import { decode, JwtPayload } from 'jsonwebtoken';
import { withPermission } from '../middleware/withPermission';
import AuditService from '@/lib/audit/audit-service';
import { AuditAction, AuditSeverity } from '@/lib/audit/types';
import RoleService from '@/lib/role-service';

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
    'audit' as any, // 'audit' is not in ResourceType, but we use it for permission checking
    'read',
    async (validatedReq) => {
      try {
        // Get tenant context and user info
        const tenantId = validatedReq.headers.get('x-tenant-id') as string;
        const authHeader = validatedReq.headers.get('authorization') as string;
        const token = authHeader.replace('Bearer ', '');
        const decoded = decode(token) as JwtPayload;
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
        
        // Build query object
        const query = {
          tenantId: isGlobalAdmin ? undefined : tenantId, // Global admins can see all tenants
          userId: userIdParam || undefined,
          action,
          severity,
          resourceType: resourceTypeParam as any || undefined,
          resourceId: resourceIdParam || undefined,
          startDate: startDateParam || undefined,
          endDate: endDateParam || undefined,
          limit: limitParam ? parseInt(limitParam) : 50,
          offset: offsetParam ? parseInt(offsetParam) : 0,
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
    'audit' as any,
    'create',
    async (validatedReq) => {
      try {
        // Get tenant context and user info
        const tenantId = validatedReq.headers.get('x-tenant-id') as string;
        const authHeader = validatedReq.headers.get('authorization') as string;
        const token = authHeader.replace('Bearer ', '');
        const decoded = decode(token) as JwtPayload;
        const userId = decoded.userId;
        
        // Parse request body
        const body = await validatedReq.json();
        
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
