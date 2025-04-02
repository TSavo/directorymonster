import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import withPermission from '@/middleware/withPermission';
import { DashboardService } from '@/lib/dashboard-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

/**
 * Handles GET requests to retrieve dashboard statistics for the admin interface.
 *
 * Validates tenant access and checks for 'read' permission on the 'setting' resource. Extracts the tenant ID from
 * the request headers and processes optional query parameters (period, startDate, and endDate) to query the
 * statistics. Returns a JSON response containing the dashboard statistics, or a 500 error response if retrieval fails.
 *
 * The endpoint supports the following query parameters:
 * - period: Time period for statistics ('day', 'week', 'month', 'quarter', 'year'). Defaults to 'month'.
 * - startDate: Optional ISO date string for custom date range start.
 * - endDate: Optional ISO date string for custom date range end.
 *
 * @param req - The incoming request with tenant headers and query parameters.
 * @returns A promise resolving to a NextResponse with the dashboard statistics data or an error message.
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
