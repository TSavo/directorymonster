import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '../../middleware/withPermission';
import AuditService from '@/lib/audit/audit-service';
import { ResourceType } from '@/components/admin/auth/utils/accessControl';

/**
 * GET handler for retrieving recent audit events
 * Requires 'read' permission on 'audit' resource type
 * 
 * Query parameters:
 * - limit: Maximum number of events to return
 * - offset: Offset for pagination
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withPermission(
    req,
    'audit',
    'read',
    async (validatedReq) => {
      try {
        // Get tenant ID from request
        const tenantId = validatedReq.headers.get('x-tenant-id') as string;
        
        // Parse query parameters for pagination
        const url = new URL(validatedReq.url);
        const limitParam = url.searchParams.get('limit');
        const offsetParam = url.searchParams.get('offset');
        
        // Validate and apply limits for pagination to prevent unbounded queries
        const parsedLimit = limitParam ? parseInt(limitParam, 10) : 50;
        const limit = isNaN(parsedLimit) ? 50 : Math.min(parsedLimit, 1000); // Maximum 1000 results
        
        const parsedOffset = offsetParam ? parseInt(offsetParam, 10) : 0;
        const offset = isNaN(parsedOffset) ? 0 : Math.max(parsedOffset, 0); // Non-negative offset
        
        // Get recent events
        const events = await AuditService.getRecentEvents(
          tenantId,
          limit,
          offset
        );
        
        return NextResponse.json({ events });
      } catch (error) {
        console.error('Error retrieving recent audit events:', error);
        return NextResponse.json(
          { error: 'Error retrieving recent audit events' },
          { status: 500 }
        );
      }
    }
  );
}
