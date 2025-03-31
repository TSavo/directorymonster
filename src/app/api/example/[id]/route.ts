import { NextRequest, NextResponse } from 'next/server';
import { withPermission } from '../../middleware';

/**
 * Example API route with resource ID parameter
 * GET /api/example/:id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const resourceId = params.id;
  
  // Use the permission middleware with resource ID
  return withPermission(
    req,
    'category',  // Resource type
    'read',      // Permission
    async (validatedReq) => {
      // This code only runs if tenant access and permission check pass
      const tenantId = validatedReq.headers.get('x-tenant-id');
      
      return NextResponse.json({
        message: `Successfully retrieved category ${resourceId} in tenant ${tenantId}`,
        resourceId,
        data: {
          id: resourceId,
          name: 'Example Category',
          description: 'This is a sample category',
          tenantId
        },
        success: true
      });
    }
  );
}

/**
 * Example API route with resource ID parameter
 * PUT /api/example/:id
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const resourceId = params.id;
  
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
        data: {
          id: resourceId,
          ...data,
          tenantId
        },
        success: true
      });
    }
  );
}

/**
 * Example API route with resource ID parameter
 * DELETE /api/example/:id
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const resourceId = params.id;
  
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
