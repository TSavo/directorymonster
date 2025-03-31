import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '../../middleware/withPermission';
import AuditService from '@/lib/audit/audit-service';
import { ResourceType } from '@/components/admin/auth/utils/accessControl';

/**
 * Handles GET requests to retrieve recent audit events.
 *
 * This endpoint enforces that the requester has 'read' permission on the 'audit' resource via middleware.
 * It extracts the tenant identifier from the 'x-tenant-id' header and parses the 'limit' and 'offset' query
 * parameters from the URL for pagination. The 'limit' defaults to 50 and is capped at 1000 to prevent overly
 * large queries, while 'offset' defaults to 0 and is constrained to non-negative values.
 *
 * On success, it returns a JSON response containing the retrieved audit events. If an error occurs during
 * processing, the error is logged and a JSON response with a 500 status code is returned.
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
