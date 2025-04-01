import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withResourcePermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { CategoryService } from '@/lib/category-service';

/**
 * Retrieves a category by ID with tenant access and permission validation.
 *
 * This endpoint first verifies that the incoming request has valid tenant access and the
 * necessary 'read' permission for the 'category' resource. It then returns a JSON response
 * containing the category details, including the ID, mock name, and tenant ID. If an error occurs
 * during retrieval, the function logs the error and responds with a 500 status code along with an
 * appropriate error message.
 *
 * @param params - Route parameters containing the category ID.
 * @returns A NextResponse with the category data on success, or an error message on failure.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withResourcePermission(
      req,
      'category' as ResourceType,
      'read' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context and category ID
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;
          const categoryId = params.id;

          // Get the category with tenant validation
          const category = await CategoryService.getCategoryWithTenantValidation(categoryId, tenantId);

          // Check if the category exists and belongs to the tenant
          if (!category) {
            return NextResponse.json(
              { error: 'Category not found or does not belong to this tenant' },
              { status: 404 }
            );
          }

          // Return the category data
          return NextResponse.json({ category });
        } catch (error) {
          console.error(`Error retrieving category ${params.id}:`, error);
          return NextResponse.json(
            { error: 'Failed to retrieve category' },
            { status: 500 }
          );
        }
      }
    )
  );
}

/**
 * Updates a specific category by ID.
 *
 * This endpoint validates tenant access and ensures the requester has the 'update'
 * permission for the category resource. It retrieves the tenant ID from the 'x-tenant-id'
 * header and extracts the category ID from the route parameters. The function parses the
 * request body for update details and returns a JSON response containing the updated category,
 * including its ID, the provided update data, and the tenant ID. On failure, a JSON error message
 * with a 500 status code is returned.
 *
 * @param req The incoming HTTP request.
 * @param params An object with route parameters, including the category ID.
 * @returns A NextResponse with a JSON payload representing the updated category.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withResourcePermission(
      req,
      'category' as ResourceType,
      'update' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context and category ID
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;
          const categoryId = params.id;

          // Parse the request body
          const data = await req.json();

          // Update the category with tenant validation
          const updatedCategory = await CategoryService.updateCategoryWithTenantValidation(
            categoryId,
            tenantId,
            data
          );

          // Check if the category exists and belongs to the tenant
          if (!updatedCategory) {
            return NextResponse.json(
              { error: 'Category not found or does not belong to this tenant' },
              { status: 404 }
            );
          }

          // Return the updated category
          return NextResponse.json({ category: updatedCategory });
        } catch (error) {
          console.error(`Error updating category ${params.id}:`, error);
          return NextResponse.json(
            { error: 'Failed to update category' },
            { status: 500 }
          );
        }
      }
    )
  );
}

/**
 * Deletes a category resource by its ID.
 *
 * Validates tenant access and enforces the 'delete' permission on the category resource.
 * Extracts the tenant ID from the request headers and the category ID from the route parameters.
 * Returns a JSON response confirming the deletion or an error response with a 500 status on failure.
 *
 * @param req The incoming HTTP request.
 * @param params Object containing the category ID from the route parameters.
 * @returns A JSON response detailing the result of the deletion.
 *
 * @remarks Currently, the deletion is simulated with a mock response for testing purposes.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withTenantAccess(
    req,
    withResourcePermission(
      req,
      'category' as ResourceType,
      'delete' as Permission,
      async (validatedReq) => {
        try {
          // Get tenant context and category ID
          const tenantId = validatedReq.headers.get('x-tenant-id') as string;
          const categoryId = params.id;

          // Delete the category with tenant validation
          const success = await CategoryService.deleteCategoryWithTenantValidation(
            categoryId,
            tenantId
          );

          // Check if the category exists and belongs to the tenant
          if (!success) {
            return NextResponse.json(
              { error: 'Category not found or does not belong to this tenant' },
              { status: 404 }
            );
          }

          return NextResponse.json({
            success: true,
            message: `Category ${categoryId} deleted successfully`
          });
        } catch (error) {
          console.error(`Error deleting category ${params.id}:`, error);
          return NextResponse.json(
            { error: 'Failed to delete category' },
            { status: 500 }
          );
        }
      }
    )
  );
}
