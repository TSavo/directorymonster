import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess, withPermission } from '../middleware';

/**
 * Example API route that uses tenant access middleware
 * GET /api/example
 */
export async function GET(req: NextRequest) {
  // Use the tenant access middleware to validate tenant context
  return withTenantAccess(req, async (validatedReq) => {
    // This code only runs if tenant access is valid
    const tenantId = validatedReq.headers.get('x-tenant-id');
    
    return NextResponse.json({
      message: `Successfully accessed tenant ${tenantId}`,
      success: true
    });
  });
}

/**
 * Example API route with permission check
 * POST /api/example
 */
export async function POST(req: NextRequest) {
  // Use the permission middleware to validate both tenant access and specific permission
  return withPermission(
    req,
    'category', // Resource type
    'create',   // Permission
    async (validatedReq) => {
      // This code only runs if tenant access and permission check pass
      const tenantId = validatedReq.headers.get('x-tenant-id');
      
      // Parse the request body
      const data = await req.json();
      
      return NextResponse.json({
        message: `Successfully created category in tenant ${tenantId}`,
        data,
        success: true
      });
    }
  );
}

/**
 * Example API route with specific resource permission check
 * PUT /api/example/:id
 */
export async function PUT(req: NextRequest) {
  // Extract resource ID from URL params or request path
  const resourceId = req.url.split('/').pop();
  
  // Use the permission middleware with resource ID
  return withPermission(
    req,
    'category',  // Resource type
    'update',    // Permission
    async (validatedReq) => {
      // This code only runs if tenant access and permission check pass
      const tenantId = validatedReq.headers.get('x-tenant-id');
      
      // Parse the request body
      const data = await req.json();
      
      return NextResponse.json({
        message: `Successfully updated category ${resourceId} in tenant ${tenantId}`,
        resourceId,
        data,
        success: true
      });
    }
  );
}

/**
 * Example API route with delete permission check
 * DELETE /api/example/:id
 */
export async function DELETE(req: NextRequest) {
  // Extract resource ID from URL params or request path
  const resourceId = req.url.split('/').pop();
  
  // Use the permission middleware with resource ID
  return withPermission(
    req,
    'category',  // Resource type
    'delete',    // Permission
    async (validatedReq) => {
      // This code only runs if tenant access and permission check pass
      const tenantId = validatedReq.headers.get('x-tenant-id');
      
      return NextResponse.json({
        message: `Successfully deleted category ${resourceId} in tenant ${tenantId}`,
        resourceId,
        success: true
      });
    }
  );
}