import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { redis, kv } from '@/lib/redis-client';
import { Category } from '@/types';
import { AuditService } from '@/lib/audit/audit-service';
import { CategoryService } from '@/lib/category-service';

/**
 * Handles a POST request to reorder categories for a tenant.
 *
 * This endpoint validates tenant access and verifies that the user has 'update'
 * permission on the category resource. It parses the JSON request body to extract an
 * array of category IDs, checks that each corresponds to an existing category, and then
 * updates their order atomically using a Redis transaction. If the input data is invalid
 * or any category IDs cannot be found, it returns a 400 response with an error message.
 * On successful processing, it logs the action and returns a JSON response containing
 * the updated categories.
 *
 * @param req The HTTP request with tenant headers and a JSON body containing category IDs.
 * @returns A JSON response indicating success with the updated categories, or an error message.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'category' as ResourceType,
    'update' as Permission,
    async (validatedReq, context) => {
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

          // Reorder the categories using the CategoryService
          const result = await CategoryService.reorderCategoriesWithTenantValidation(
            categoryIds,
            tenantId
          );

          // Check if there were any invalid categories
          if (result.invalidCategoryIds && result.invalidCategoryIds.length > 0) {
            return NextResponse.json(
              {
                error: 'Some categories were not found or do not belong to this tenant',
                invalidCategoryIds: result.invalidCategoryIds
              },
              { status: 400 }
            );
          }

          // Log the reordering action
          await AuditService.logEvent({
            action: 'categories_reordered',
            resourceType: 'category',
            tenantId,
            details: {
              categoryIds,
              count: categoryIds.length
            }
          });

          return NextResponse.json({
            success: true,
            message: 'Categories reordered successfully',
            categories: result.updatedCategories
          });
        } catch (error) {
          console.error('Error reordering categories:', error);
          return NextResponse.json(
            { error: 'Failed to reorder categories' },
            { status: 500 }
          );
        }
    }
  );
}
