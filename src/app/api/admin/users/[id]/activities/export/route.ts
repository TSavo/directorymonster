import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { getUserActivities } from '@/lib/user/user-service';
import { getUser } from '@/lib/user/user-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/users/[id]/activities/export
 * 
 * Export activity logs for a user
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A CSV file with the user activities
 */
export const GET = withACL(
  withTenant(async (req: NextRequest, { params }: RouteParams) => {
    try {
      const { id } = params;
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }
      
      // Get query parameters
      const url = new URL(req.url);
      const searchParams = url.searchParams;
      
      // Build filter from query parameters
      const filter = {
        action: searchParams.get('action') || undefined,
        resource: searchParams.get('resource') || undefined,
        dateRange: searchParams.get('dateRange') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        limit: 1000 // Export more records
      };
      
      // Get user details
      const user = await getUser(id, tenantId);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      
      // Get user activities
      const { activities } = await getUserActivities(id, tenantId, filter);
      
      // Generate CSV content
      const csvHeader = 'Timestamp,Action,Resource,Resource ID,Description,IP Address,User Agent\n';
      const csvRows = activities.map(activity => {
        return [
          activity.timestamp,
          activity.action,
          activity.resource,
          activity.resourceId || '',
          `"${activity.description.replace(/"/g, '""')}"`,
          activity.ipAddress,
          `"${activity.userAgent.replace(/"/g, '""')}"`
        ].join(',');
      });
      const csvContent = csvHeader + csvRows.join('\n');
      
      // Set response headers for CSV download
      const headers = new Headers();
      headers.set('Content-Type', 'text/csv');
      headers.set('Content-Disposition', `attachment; filename="activity_log_${user.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv"`);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers
      });
    } catch (error) {
      console.error('Error exporting user activities:', error);
      return NextResponse.json(
        { error: 'Failed to export user activities' },
        { status: 500 }
      );
    }
  }),
  { resource: 'user', action: 'read' }
);
