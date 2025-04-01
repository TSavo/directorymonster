import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withResourcePermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { CategoryService } from '@/lib/category-service';

/**
 * Retrieves a category by its ID.
 *
 * This endpoint validates tenant access and confirms that the requester has 'read' permission on the
 * 'category' resource. It fetches the category using the CategoryService and ensures that the category exists
 * and belongs to the tenant specified in the 'x-tenant-id' header.
 *
 * - Returns a 404 response if the category is not found or does not belong to the tenant.
 * - Returns a 500 response for unexpected errors during retrieval.
 *
 * @param req - The incoming HTTP request.
 * @param params - An object containing route parameters, including the category ID.
 * @returns A JSON response with the category data on success or an error message on failure.
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
 * Updates a category resource identified by its ID.
 *
 * Handles PUT requests for updating a category. This function enforces tenant access and the 'update' 
 * permission for the category resource. It extracts the tenant ID from the request headers and obtains 
 * the category ID from the route parameters. The CategoryService is used to validate that the category 
 * exists and belongs to the specified tenant before updating it.
 * 
 * On success, the function returns a JSON response with the updated category details. In case of any errors 
 * during processing, a 500 error response is returned.
 *
 * @param req - The incoming HTTP request.
 * @param params - Route parameters containing the category ID.
 * @returns A NextResponse object containing the updated category data or an error message.
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
 * Deletes a category by its ID.
 *
 * This handler validates tenant access and ensures the requester has the 'delete' permission on the 'category' resource.
 * It uses the CategoryService to delete the category and validate tenant ownership.
 * On success, it returns a JSON response confirming the deletion; if an error occurs, it responds with a JSON error message and a 500 status code.
 *
 * @param req - The incoming request.
 * @param params - The route parameters containing the category ID to delete.
 * @returns A NextResponse with a JSON payload indicating success or error.
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
