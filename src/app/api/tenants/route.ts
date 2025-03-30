import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/tenant';
import { withRedis } from '@/middleware/withRedis';

/**
 * GET handler for retrieving all tenants
 * @param request The incoming request
 * @returns JSON response with tenant data or error
 */
async function GET(request: NextRequest) {
  try {
    // Get all tenants
    const tenants = await TenantService.getAllTenants();
    
    // Return tenants data
    return NextResponse.json(tenants);
  } catch (error) {
    console.error('Error getting all tenants:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating a new tenant
 * @param request The incoming request with tenant data
 * @returns JSON response with created tenant data or error
 */
async function POST(request: NextRequest) {
  try {
    // Parse request body
    const tenantData = await request.json();
    
    // Validate required fields
    if (!tenantData.name || !tenantData.slug || !tenantData.hostnames || tenantData.hostnames.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, and at least one hostname' },
        { status: 400 }
      );
    }
    
    // Create tenant
    const tenant = await TenantService.createTenant({
      slug: tenantData.slug,
      name: tenantData.name,
      hostnames: tenantData.hostnames,
      primaryHostname: tenantData.primaryHostname || tenantData.hostnames[0],
      theme: tenantData.theme || 'default',
      settings: tenantData.settings || {},
      active: tenantData.active !== false, // Default to active
    });
    
    // Return created tenant data
    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);
    
    // Check for specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('already used')) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 409 } // Conflict
      );
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Apply Redis middleware to both handlers
const handlers = { GET, POST };

export { handlers as GET, handlers as POST };