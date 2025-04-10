import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withTenant } from '@/lib/middleware/withTenant';
import { getUserActivities } from '@/lib/user/user-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/users/[id]/activities
 * 
 * Get activity logs for a user
 * 
 * @param req - The request object
 * @param params - The route parameters
 * @returns A response with the user activities
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
        page: searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1,
        limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 50
      };
      
      // Get user activities
      const { activities, pagination } = await getUserActivities(id, tenantId, filter);
      
      return NextResponse.json({ activities, pagination });
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user activities' },
        { status: 500 }
      );
    }
  }),
  { resource: 'user', action: 'read' }
);
