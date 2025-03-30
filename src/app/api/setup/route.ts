import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/tenant';
import { withRedis } from '@/middleware/withRedis';

/**
 * GET handler for checking if any tenants exist
 * @param request The incoming request
 * @returns JSON response with setup status
 */
async function GET(request: NextRequest) {
  try {
    // Check if any tenants exist
    const tenantsExist = await TenantService.tenantsExist();
    
    // Return setup status
    return NextResponse.json({
      needsSetup: !tenantsExist,
      setupComplete: tenantsExist
    });
  } catch (error) {
    console.error('Error checking setup status:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for initial setup with first tenant
 * @param request The incoming request with setup data
 * @returns JSON response with setup result
 */
async function POST(request: NextRequest) {
  try {
    // Check if tenants already exist
    const tenantsExist = await TenantService.tenantsExist();
    
    if (tenantsExist) {
      return NextResponse.json(
        { error: 'Setup already completed' },
        { status: 400 }
      );
    }
    
    // Parse request body
    const setupData = await request.json();
    
    // Create first tenant
    const tenant = await TenantService.createTenant({
      slug: setupData.tenant.slug,
      name: setupData.tenant.name,
      hostnames: setupData.tenant.hostnames || ['localhost'],
      primaryHostname: setupData.tenant.primaryHostname || 'localhost',
      theme: setupData.tenant.theme || 'default',
      settings: setupData.tenant.settings || {},
      active: true,
    });
    
    // Return success with tenant data
    return NextResponse.json({
      success: true,
      message: 'Initial setup completed successfully',
      tenant,
    }, { status: 201 });
  } catch (error) {
    console.error('Error during initial setup:', error);
    return NextResponse.json(
      { error: 'Setup failed', message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Apply Redis middleware to both handlers
const handlers = { GET, POST };

export { handlers as GET, handlers as POST };