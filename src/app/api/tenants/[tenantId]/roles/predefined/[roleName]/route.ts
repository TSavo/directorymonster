import { NextRequest, NextResponse } from 'next/server';
import { withRedis } from '@/middleware/withRedis';
import { withAuth } from '@/middleware/withAuth';
import { PredefinedRoles } from '@/lib/role/predefined-roles';

/**
 * POST handler for creating a predefined role in a tenant
 *
 * @param request The incoming request
 * @param params The route parameters (tenantId, roleName)
 * @returns JSON response with the created role
 */
export const POST = withRedis(
  withAuth(
    async (request: NextRequest, { params }: { params: { tenantId: string; roleName: string } }) => {
      const { tenantId, roleName } = params;

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

        // Parse request body to get siteId if provided
        const requestData = await request.json().catch(() => ({}));
        const { siteId } = requestData;

        // Check if this is a site-specific role
        const isSiteRole = roleName.startsWith('Site ');

        if (isSiteRole && !siteId) {
          return NextResponse.json(
            { error: `Site ID is required for site-specific role: ${roleName}` },
            { status: 400 }
          );
        }

        // Create the predefined role
        const role = await PredefinedRoles.createPredefinedRole(tenantId, roleName, siteId);

        if (!role) {
          return NextResponse.json(
            { error: `Predefined role '${roleName}' not found` },
            { status: 404 }
          );
        }

        return NextResponse.json(role);
      } catch (error: any) {
        console.error(`Error creating predefined role '${roleName}':`, error);

        return NextResponse.json(
          { error: error.message || 'Failed to create predefined role' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'manage:role' }
  )
);

/**
 * GET handler for retrieving a predefined role template
 *
 * @param request The incoming request
 * @param params The route parameters (tenantId, roleName)
 * @returns JSON response with the role template
 */
export const GET = withRedis(
  withAuth(
    async (request: NextRequest, { params }: { params: { tenantId: string; roleName: string } }) => {
      const { roleName } = params;

      try {
        // Get the predefined role template
        const roleTemplate = PredefinedRoles.getPredefinedRole(roleName);

        if (!roleTemplate) {
          return NextResponse.json(
            { error: `Predefined role '${roleName}' not found` },
            { status: 404 }
          );
        }

        return NextResponse.json(roleTemplate);
      } catch (error: any) {
        console.error(`Error retrieving predefined role '${roleName}':`, error);

        return NextResponse.json(
          { error: error.message || 'Failed to retrieve predefined role' },
          { status: 500 }
        );
      }
    },
    { requiredPermission: 'read:role' }
  )
);
