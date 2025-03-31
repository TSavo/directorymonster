import { NextRequest, NextResponse } from 'next/server';
import { decode, JwtPayload } from 'jsonwebtoken';
import { withPermission } from '../../middleware/withPermission';
import AuditService from '@/lib/audit/audit-service';
import RoleService from '@/lib/role-service';

/**
 * GET handler for retrieving recent audit logs for the current tenant
 * Simplified endpoint that returns the most recent events, useful for dashboards
 * Requires 'read' permission on 'audit' resource type
 * 
 * Query parameters:
 * - limit: Maximum number of results to return (default: 20)
 * - offset: Offset for pagination (default: 0)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withPermission(
    req,
    'audit' as any,
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
        const limitParam = url.searchParams.get('limit');
        const offsetParam = url.searchParams.get('offset');
        
        const limit = limitParam ? parseInt(limitParam) : 20;
        const offset = offsetParam ? parseInt(offsetParam) : 0;
        
        // Check if user is a global admin
        const isGlobalAdmin = await RoleService.hasGlobalRole(userId);
        
        // Get recent events
        const events = await AuditService.getRecentEvents(
          tenantId,
          limit,
          offset
        );
        
        return NextResponse.json({ events });
      } catch (error) {
        console.error('Error retrieving recent audit logs:', error);
        return NextResponse.json(
          { error: 'Error retrieving recent audit logs' },
          { status: 500 }
        );
      }
    }
  );
}
