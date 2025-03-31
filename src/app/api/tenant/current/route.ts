import { NextRequest, NextResponse } from 'next/server';
import { resolveTenant } from '../../../../lib/tenant-resolver';

// Set runtime to Node.js
export const runtime = 'nodejs';

/**
 * API route to get current tenant based on request headers
 */
export async function GET(request: NextRequest) {
  try {
    // Get tenant from resolver (uses header info set by middleware)
    const tenant = await resolveTenant();
    
    // If tenant not found, return 404
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    // Return tenant data
    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error getting tenant:', error);
    
    // Return error response
    return NextResponse.json(
      { error: 'Server error', message: 'Failed to retrieve tenant information' },
      { status: 500 }
    );
  }
}