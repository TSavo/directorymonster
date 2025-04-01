import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withPermission } from '@/middleware/withPermission';
import { DashboardService } from '@/lib/dashboard-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

/**
 * Handles GET requests to fetch dashboard statistics for the admin interface.
 *
 * Validates tenant access and confirms that the user has 'read' permission on the 'setting' resource.
 * Extracts the tenant ID from the request headers along with optional query parameters (period, startDate, and endDate)
 * to determine the timeframe for the statistics. Returns a JSON response with the dashboard statistics on success,
 * or a JSON error message with a 500 status code if an error occurs.
 *
 * @param req - The incoming HTTP request.
 * @returns A NextResponse JSON object containing either the dashboard statistics or an error message.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withPermission(
      req,
      'setting' as ResourceType,
      'read' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;

          // Get query parameters for time period
          const url = new URL(validatedReq.url);
          const period = url.searchParams.get('period') || 'month';
          const startDate = url.searchParams.get('startDate') || undefined;
          const endDate = url.searchParams.get('endDate') || undefined;

          // Get dashboard stats from service
          const stats = await DashboardService.getStats({
            tenantId,
            period: period as 'day' | 'week' | 'month' | 'quarter' | 'year',
            startDate,
            endDate
          });

          return NextResponse.json({ stats });
        } catch (error) {
          console.error('Error retrieving dashboard stats:', error);
          return NextResponse.json(
            { error: 'Failed to retrieve dashboard statistics' },
            { status: 500 }
          );
        }
      }
    )
  );
}
