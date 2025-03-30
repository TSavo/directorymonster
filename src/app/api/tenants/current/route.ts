import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/tenant';
import { withRedis } from '@/middleware/withRedis';

/**
 * GET handler for retrieving the current tenant
 * @param request The incoming request
 * @returns JSON response with tenant data or error
 */
async function GET(request: NextRequest) {
  try {
    // Get tenant ID from header
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenant found for this hostname' },
        { status: 404 }
      );
    }
    
    // Get tenant data
    const tenant = await TenantService.getTenantById(tenantId);
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Return tenant data
    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error getting current tenant:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Wrap with Redis error handling
export { GET };