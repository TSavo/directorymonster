import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withPermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { CategoryService } from '@/lib/category-service';

/**
 * Retrieves all categories for the current tenant.
 *
 * Validates tenant access and read permission on the 'category' resource before processing the request.
 * If the tenant is valid and authorized, the function returns an empty list as a placeholder.
 * In the event of an error during processing, it logs the error and responds with a 500 status code along with an error message.
 *
 * @param req - The incoming HTTP request containing tenant details in its headers.
 * @returns A NextResponse with a JSON payload containing either the categories data or an error message.
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
 * This endpoint validates tenant access and checks for the 'create' permission on the 'category'
 * resource. It extracts the tenant identifier from the 'x-tenant-id' header and responds with a mock
 * category object that includes an id, a name, and the tenant id. If an error occurs during processing,
 * a JSON response with a 500 status code and an error message is returned.
 *
 * @param req - The incoming NextRequest object.
 * @returns A NextResponse containing the newly created category data as JSON.
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
