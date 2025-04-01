import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withPermission } from '@/middleware/withPermission';
import { DashboardService } from '@/lib/dashboard-service';
import { ResourceType, Permission } from '@/components/admin/auth/utils/accessControl';

/**
 * GET /api/admin/dashboard/stats
 *
 * Retrieves dashboard statistics for the admin interface
 * Requires 'read' permission on 'setting' resource
 *
 * @param req The incoming request
 * @returns Dashboard statistics data
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
