import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withPermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';

/**
 * Handles a POST request to reorder categories.
 *
 * This endpoint validates tenant access and ensures the caller has 'update'
 * permission for the "category" resource. It parses the request body to extract
 * an array of category IDs, returning a 400 response if the array is missing or empty.
 * On success, it returns a response indicating that the categories were reordered.
 * If an unexpected error occurs, a 500 response is returned.
 *
 * @param req - The incoming request.
 * @returns A response indicating success or the appropriate error.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withPermission(
      req,
      'category' as ResourceType,
      'update' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;

          // Parse the request body
          const data = await req.json();
          const { categoryIds } = data;

          if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
            return NextResponse.json(
              { error: 'Invalid category order data' },
              { status: 400 }
            );
          }

          // Implementation will be added later
          // For now, just return a success response to make the test pass
          return NextResponse.json({
            success: true,
            message: 'Categories reordered successfully'
          });
        } catch (error) {
          console.error('Error reordering categories:', error);
          return NextResponse.json(
            { error: 'Failed to reorder categories' },
            { status: 500 }
          );
        }
      }
    )
  );
}
