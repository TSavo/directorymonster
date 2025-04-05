import { NextRequest, NextResponse } from 'next/server';
import { validateTenantSiteContext } from '@/app/api/middleware';

/**
 * API route to test tenant and site context
 * 
 * This route returns the tenant and site context extracted from the request.
 * It requires a tenant ID but site ID is optional.
 */
export async function GET(req: NextRequest) {
  return validateTenantSiteContext(req, async (reqWithContext) => {
    // Get tenant and site IDs from headers
    const tenantId = reqWithContext.headers.get('x-tenant-id');
    const siteId = reqWithContext.headers.get('x-site-id');
    
    // Return the context
    return NextResponse.json({
      tenantId,
      siteId,
      message: 'Context successfully extracted'
    });
  });
}

/**
 * API route that requires both tenant and site context
 */
export async function POST(req: NextRequest) {
  return validateTenantSiteContext(req, async (reqWithContext) => {
    // Get tenant and site IDs from headers
    const tenantId = reqWithContext.headers.get('x-tenant-id');
    const siteId = reqWithContext.headers.get('x-site-id');
    
    // Return the context
    return NextResponse.json({
      tenantId,
      siteId,
      message: 'Context successfully extracted with site required'
    });
  }, true); // requireSite = true
}
