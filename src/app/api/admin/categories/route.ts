import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withPermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { CategoryService } from '@/lib/category-service';

/**
 * Retrieves all categories for a tenant.
 *
 * This endpoint handles GET requests for fetching all categories associated with a tenant.
 * It validates tenant access and ensures the request has the 'read' permission on the category resource,
 * with the tenant identified by the "x-tenant-id" header.
 *
 * In case of an error during processing, the function logs the error and returns a JSON response with a 500 status and an error message.
 *
 * @param req - The incoming Next.js request that contains tenant and permission details.
 * @returns A JSON response containing categories data or an error message.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withPermission(
      req,
      'category' as ResourceType,
      'read' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;

          // Get all categories for this tenant
          const categories = await CategoryService.getCategoriesByTenant(tenantId);

          // Return the categories
          return NextResponse.json({ categories });
        } catch (error) {
          console.error('Error retrieving categories:', error);
          return NextResponse.json(
            { error: 'Failed to retrieve categories' },
            { status: 500 }
          );
        }
      }
    )
  );
}

/**
 * Handles POST requests to create a new category.
 *
 * This function validates tenant access and confirms that the request has the required 'create'
 * permission on the 'category' resource. It expects a JSON body with category data.
 * If validation fails, a 400 response with an error message is returned. On successful creation,
 * it returns the new category object with its ID and tenant association.
 * In case of an unexpected error, it logs the error and responds with a 500 error.
 *
 * @param req - The incoming request object.
 * @returns A NextResponse containing either the created category data or an error message.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withPermission(
      req,
      'category' as ResourceType,
      'create' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;

          // Parse the request body
          const data = await req.json();

          // Create a new category with tenant association
          const newCategory = await CategoryService.createCategoryWithTenant(data, tenantId);

          // Check if the category was created successfully
          if (!newCategory) {
            return NextResponse.json(
              { error: 'Failed to create category' },
              { status: 500 }
            );
          }

          return NextResponse.json({ category: newCategory });
        } catch (error) {
          console.error('Error creating category:', error);
          return NextResponse.json(
            { error: 'Failed to create category' },
            { status: 500 }
          );
        }
      }
    )
  );
}
