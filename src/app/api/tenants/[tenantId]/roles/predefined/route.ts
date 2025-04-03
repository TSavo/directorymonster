import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '@/middleware/withRedis';
import { withAuth } from '@/middleware/withAuth';
import { PredefinedRoles } from '@/lib/role/predefined-roles';

/**
 * GET handler for retrieving all predefined role templates
 *
 * @param request The incoming request
 * @param params The route parameters (tenantId)
 * @returns JSON response with the role templates
 */
export const GET = withRedis(
  withAuth(
    async (request: NextRequest, { params }: { params: { tenantId: string } }) => {
      try {
        // Get all predefined role templates
        const tenantRoleTemplates = [
          PredefinedRoles.TENANT_ADMIN_ROLE,
          PredefinedRoles.TENANT_EDITOR_ROLE,
          PredefinedRoles.TENANT_AUTHOR_ROLE,
          PredefinedRoles.TENANT_VIEWER_ROLE
        ];

        const siteRoleTemplates = [
          PredefinedRoles.SITE_ADMIN_ROLE,
          PredefinedRoles.SITE_EDITOR_ROLE,
          PredefinedRoles.SITE_AUTHOR_ROLE,
          PredefinedRoles.SITE_VIEWER_ROLE
        ];

        // Group templates by type
        const roleTemplates = {
          tenantRoles: tenantRoleTemplates,
          siteRoles: siteRoleTemplates
        };

        return NextResponse.json(roleTemplates);
      } catch (error: any) {
        console.error('Error retrieving predefined roles:', error);

        return NextResponse.json(
          { error: error.message || 'Failed to retrieve predefined roles' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'read:role' }
  )
);

/**
 * POST handler for creating predefined roles in a tenant
 *
 * @param request The incoming request
 * @param params The route parameters (tenantId)
 * @returns JSON response with the created roles
 */
export const POST = withRedis(
  withAuth(
    async (request: NextRequest, { params }: { params: { tenantId: string } }) => {
      const { tenantId } = params;

      try {
        // Get the tenant ID from the auth object (set by withAuth middleware)
        const authTenantId = (request as any).auth?.tenantId;

        // Verify the user is operating in the correct tenant
        if (authTenantId !== tenantId) {
          return NextResponse.json(
            { error: 'You do not have permission to create roles in this tenant' },
            { status: 403 }
          );
        }

        // Parse request body to get options
        const requestData = await request.json().catch(() => ({}));
        const { siteId, type } = requestData;

        let roles = [];

        if (type === 'site' && siteId) {
          // Create site-specific roles only
          roles = await PredefinedRoles.createSiteRoles(tenantId, siteId);
        } else if (type === 'tenant') {
          // Create tenant-wide roles only
          roles = await PredefinedRoles.createTenantRoles(tenantId);
        } else if (siteId) {
          // Create both tenant-wide and site-specific roles
          roles = await PredefinedRoles.createAllRoles(tenantId, siteId);
        } else {
          // Create tenant-wide roles only (default)
          roles = await PredefinedRoles.createTenantRoles(tenantId);
        }

        return NextResponse.json(roles);
      } catch (error: any) {
        console.error('Error creating predefined roles:', error);

        return NextResponse.json(
          { error: error.message || 'Failed to create predefined roles' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'manage:role' }
  )
);
