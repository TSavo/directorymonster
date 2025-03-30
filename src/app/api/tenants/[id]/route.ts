import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/tenant';
import { withRedis } from '@/middleware/withRedis';

/**
 * GET handler for retrieving a tenant by ID
 * @param request The incoming request
 * @param params Route parameters containing the tenant ID
 * @returns JSON response with tenant data or error
 */
async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get tenant data
    const tenant = await TenantService.getTenantById(id);
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Return tenant data
    return NextResponse.json(tenant);
  } catch (error) {
    console.error(`Error getting tenant ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating a tenant
 * @param request The incoming request with update data
 * @param params Route parameters containing the tenant ID
 * @returns JSON response with updated tenant data or error
 */
async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Parse request body
    const updates = await request.json();
    
    // Update tenant
    const updatedTenant = await TenantService.updateTenant(id, updates);
    
    if (!updatedTenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Return updated tenant data
    return NextResponse.json(updatedTenant);
  } catch (error) {
    console.error(`Error updating tenant ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing a tenant
 * @param request The incoming request
 * @param params Route parameters containing the tenant ID
 * @returns JSON response with success or error
 */
async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Delete tenant
    const success = await TenantService.deleteTenant(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Tenant not found or could not be deleted' },
        { status: 404 }
      );
    }
    
    // Return success
    return NextResponse.json(
      { success: true, message: 'Tenant deleted successfully' }
    );
  } catch (error) {
    console.error(`Error deleting tenant ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Apply Redis middleware to all handlers
const handlers = { GET, PATCH, DELETE };

export { handlers as GET, handlers as PATCH, handlers as DELETE };