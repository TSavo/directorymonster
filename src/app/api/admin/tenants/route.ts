/**
 * GET /api/admin/tenants API Route
 * 
 * This endpoint allows super-administrators to retrieve a list of all tenants
 * with filtering, sorting, and pagination options.
 */

import { NextRequest, NextResponse } from 'next/server';
import TenantService from '@/lib/tenant-service';
import { withPermission } from '@/app/api/middleware';

/**
 * GET handler for /api/admin/tenants
 * Returns a list of all tenants with filtering, sorting, and pagination
 * 
 * @param request The incoming request
 * @returns JSON response with tenant data or error
 */
export async function GET(request: NextRequest) {
  return withPermission(
    request,
    'tenant', // Resource type
    'read',   // Permission
    async (validatedRequest) => {
      try {
        // Extract query parameters
        const url = new URL(validatedRequest.url);
        const searchParams = url.searchParams;
        
        // Filtering parameters
        const status = searchParams.get('status') || undefined;
        const subscriptionType = searchParams.get('subscriptionType') || undefined;
        const fromDate = searchParams.get('fromDate') || undefined;
        const toDate = searchParams.get('toDate') || undefined;
        const search = searchParams.get('search') || undefined;
        
        // Pagination parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '20', 10);
        
        // Sorting parameters
        const sort = searchParams.get('sort') || 'createdAt';
        const order = searchParams.get('order') || 'desc';
        
        // Include detailed stats
        const includeStats = searchParams.get('includeStats') === 'true';
        
        // Get tenants with filters
        const result = await TenantService.getAllTenants({
          status,
          subscriptionType,
          fromDate,
          toDate,
          search,
          page,
          limit,
          sort,
          order,
          includeStats
        });
        
        // Extract tenants and total count
        let tenants = [];
        let total = 0;
        
        if (Array.isArray(result)) {
          // If result is an array, it's just the tenants
          tenants = result;
          total = result.length;
        } else {
          // If result is an object, it has tenants and total properties
          tenants = result.tenants || [];
          total = result.total || tenants.length;
        }
        
        // Calculate pagination info
        const pages = Math.ceil(total / limit);
        
        // Calculate tenant statistics
        const stats = {
          active: tenants.filter(tenant => tenant.status === 'active').length,
          suspended: tenants.filter(tenant => tenant.status === 'suspended').length,
          trial: tenants.filter(tenant => tenant.status === 'trial').length,
          archived: tenants.filter(tenant => tenant.status === 'archived').length,
          totalTenants: total
        };
        
        // Return formatted response
        return NextResponse.json({
          tenants,
          pagination: {
            total,
            page,
            limit,
            pages
          },
          stats
        });
      } catch (error) {
        console.error('Error retrieving tenants:', error);
        return NextResponse.json(
          { error: 'Failed to retrieve tenants' },
          { status: 500 }
        );
      }
    }
  ).catch(error => {
    console.error('Error in tenant listing endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tenants' },
      { status: 500 }
    );
  });
}