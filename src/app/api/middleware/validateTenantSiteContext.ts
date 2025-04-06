import { NextRequest, NextResponse } from 'next/server';
import { withTenantSiteContext } from './withTenantSiteContext';

/**
 * Middleware to validate tenant and site context
 *
 * This middleware:
 * 1. Extracts tenant and site context using withTenantSiteContext
 * 2. Validates that the tenant ID is present
 * 3. Validates that the site ID is present if requireSite is true
 *
 * @param req The Next.js request
 * @param handler The handler function to execute if validation passes
 * @param requireSite Whether to require a site ID (default: false)
 * @returns Response from handler or error response
 */
export async function validateTenantSiteContext(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  requireSite: boolean = false
): Promise<NextResponse> {
  try {
    return await withTenantSiteContext(req, async (reqWithContext) => {
      // Get tenant and site IDs from headers
      const tenantId = reqWithContext.headers.get('x-tenant-id');
      const siteId = reqWithContext.headers.get('x-site-id');

      // Validate tenant ID
      if (!tenantId) {
        return NextResponse.json(
          {
            error: 'Missing tenant context',
            message: 'Tenant ID is required for this operation'
          },
          { status: 400 }
        );
      }

      // Validate site ID if required
      if (requireSite && !siteId) {
        return NextResponse.json(
          {
            error: 'Missing site context',
            message: 'Site ID is required for this operation'
          },
          { status: 400 }
        );
      }

      // If validation passes, proceed to the handler
      return await handler(reqWithContext);
    });
  } catch (error) {
    // Log the error for debugging
    console.error('Error in tenant-site context middleware:', error);

    // Return a generic error response
    return NextResponse.json(
      {
        error: 'Error processing tenant-site context',
        message: 'An error occurred while processing tenant and site context'
      },
      { status: 500 }
    );
  }
}
