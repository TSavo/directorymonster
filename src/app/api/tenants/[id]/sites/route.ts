import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/acl/types';
import { SiteService } from '@/lib/site-service';

/**
 * GET handler for retrieving sites for a specific tenant
 * @param request The incoming request
 * @param params Route parameters containing the tenant ID
 * @returns JSON response with site data or error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withSecureTenantPermission(
    request,
    'site' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        const { id } = params;

        // Verify that the requested tenant ID matches the context tenant ID
        // This prevents users from accessing sites from tenants they don't have access to
        if (id !== context.tenantId) {
          return NextResponse.json(
            { error: 'Access denied to requested tenant' },
            { status: 403 }
          );
        }

        // Get sites for the tenant
        const sites = await SiteService.getSitesByTenant(id);

        // Return sites data
        return NextResponse.json(sites);
      } catch (error) {
        console.error(`Error getting sites for tenant ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      }
    }
  );
}
