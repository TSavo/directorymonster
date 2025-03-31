import { NextRequest, NextResponse } from 'next/server';
import { verify, JwtPayload } from 'jsonwebtoken';
import { withPermission } from '../../middleware/withPermission';
import AuditService from '@/lib/audit/audit-service';
import RoleService from '@/lib/role-service';
import { ResourceType } from '@/components/admin/auth/utils/accessControl';

// JWT secret should be stored in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-for-development';

/**
 * GET handler for retrieving audit event statistics
 * Requires 'read' permission on 'audit' resource type
 * 
 * Query parameters:
 * - startDate: Start date for stats calculation (ISO string)
 * - endDate: End date for stats calculation (ISO string)
 * - days: Number of days to include (default: 30)
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withPermission(
    req,
    'audit',
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
        const startDateParam = url.searchParams.get('startDate');
        const endDateParam = url.searchParams.get('endDate');
        const daysParam = url.searchParams.get('days');
        
        // Validate date parameters if provided
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
        
        // Calculate date range
        let startDate: string;
        let endDate: string;
        
        if (startDateParam && endDateParam) {
          // Use provided date range
          startDate = startDateParam;
          endDate = endDateParam;
        } else {
          // Use default date range (last 30 days or specified number of days)
          const daysToInclude = daysParam ? parseInt(daysParam, 10) : 30;
          const days = isNaN(daysToInclude) ? 30 : Math.min(Math.max(daysToInclude, 1), 365); // Between 1 and 365 days
          
          const now = new Date();
          const past = new Date(now);
          past.setDate(past.getDate() - days);
          
          startDate = past.toISOString();
          endDate = now.toISOString();
        }
        
        // Check if user is a global admin (can see cross-tenant events)
        const isGlobalAdmin = await RoleService.hasGlobalRole(userId);
        
        // Query events for the time period with a reasonable limit to prevent performance issues
        const events = await AuditService.queryEvents(
          {
            tenantId: isGlobalAdmin ? undefined : tenantId,
            startDate,
            endDate,
            limit: 5000 // Reasonable limit for statistics calculation
          },
          tenantId,
          isGlobalAdmin
        );
        
        // Calculate statistics
        const stats = {
          total: events.length,
          byAction: {} as Record<string, number>,
          bySeverity: {} as Record<string, number>,
          byResource: {} as Record<string, number>,
          byUser: {} as Record<string, number>,
          byDay: {} as Record<string, number>,
          successRate: 0
        };
        
        // Count events by various dimensions
        let successCount = 0;
        
        events.forEach(event => {
          // Count by action
          stats.byAction[event.action] = (stats.byAction[event.action] || 0) + 1;
          
          // Count by severity
          stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
          
          // Count by resource type
          if (event.resourceType) {
            stats.byResource[event.resourceType] = (stats.byResource[event.resourceType] || 0) + 1;
          }
          
          // Count by user
          stats.byUser[event.userId] = (stats.byUser[event.userId] || 0) + 1;
          
          // Count by day
          const day = event.timestamp.split('T')[0]; // Extract date part (YYYY-MM-DD)
          stats.byDay[day] = (stats.byDay[day] || 0) + 1;
          
          // Count successful events
          if (event.success) {
            successCount++;
          }
        });
        
        // Calculate success rate
        stats.successRate = events.length > 0 ? (successCount / events.length) * 100 : 0;
        
        return NextResponse.json({ stats });
      } catch (error) {
        console.error('Error retrieving audit statistics:', error);
        return NextResponse.json(
          { error: 'Error retrieving audit statistics' },
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
