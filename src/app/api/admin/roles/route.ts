import { NextRequest, NextResponse } from 'next/server';
import { withACL } from '@/lib/middleware/withACL';
import { withSite } from '@/lib/middleware/withSite';
import { withTenant } from '@/lib/middleware/withTenant';
import { getRoles } from '@/lib/role/role-service';
import { RoleFilter } from '@/types/role';

/**
 * GET /api/admin/roles
 * 
 * Get all roles for the current tenant
 * 
 * @param req - The request object
 * @returns A response with the roles
 */
export const GET = withACL(
  withTenant(async (req: NextRequest) => {
    try {
      // Get query parameters
      const url = new URL(req.url);
      const searchParams = url.searchParams;
      
      // Build filter from query parameters
      const filter: RoleFilter = {
        search: searchParams.get('search') || undefined,
        scope: searchParams.get('scope') as any || undefined,
        type: searchParams.get('type') as any || undefined,
        siteId: searchParams.get('siteId') || undefined,
        page: searchParams.has('page') ? parseInt(searchParams.get('page')!) : 1,
        limit: searchParams.has('limit') ? parseInt(searchParams.get('limit')!) : 10,
        sortBy: searchParams.get('sort') || 'name',
        sortOrder: searchParams.get('order') as 'asc' | 'desc' || 'asc'
      };
      
      // Get tenant ID from request
      const tenantId = req.tenant?.id;
      
      if (!tenantId) {
        return NextResponse.json(
          { error: 'Tenant not found' },
          { status: 404 }
        );
      }
      
      // Get roles
      const { roles, pagination } = await getRoles(tenantId, filter);
      
      return NextResponse.json({ roles, pagination });
    } catch (error) {
      console.error('Error fetching roles:', error);
      return NextResponse.json(
        { error: 'Failed to fetch roles' },
        { status: 500 }
      );
    }
  }),
  { resource: 'role', action: 'read' }
);
