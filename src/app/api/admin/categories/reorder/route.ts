import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess } from '@/middleware/tenant-validation';
import { withPermission } from '@/middleware/withPermission';
import { ResourceType, Permission } from '@/types/permissions';
import { redis, kv } from '@/lib/redis-client';
import { Category } from '@/types';
import { AuditService } from '@/lib/audit/audit-service';

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

          // Validate that all category IDs belong to the tenant
          const validCategories: Category[] = [];
          const invalidCategoryIds: string[] = [];

          // Fetch all categories for validation
          for (const categoryId of categoryIds) {
            const category = await kv.get<Category>(`category:id:${categoryId}`);

            if (!category) {
              invalidCategoryIds.push(categoryId);
              continue;
            }

            // Ensure the category belongs to this tenant
            // In a multi-tenant system, we'd need to check if the category's site belongs to the tenant
            // For now, we'll just add the category to our valid list
            validCategories.push(category);
          }

          // If there are invalid category IDs, return an error
          if (invalidCategoryIds.length > 0) {
            return NextResponse.json(
              {
                error: 'Some categories were not found',
                invalidCategoryIds
              },
              { status: 400 }
            );
          }

          // Use a Redis transaction for atomicity
          const multi = redis.multi();

          // Update the order of each category
          const updatedCategories: Category[] = [];

          for (let i = 0; i < categoryIds.length; i++) {
            const categoryId = categoryIds[i];
            const category = validCategories.find(c => c.id === categoryId);

            if (category) {
              // Update the order
              const updatedCategory: Category = {
                ...category,
                order: i + 1, // 1-based ordering
                updatedAt: Date.now()
              };

              // Add to transaction
              multi.set(`category:id:${categoryId}`, JSON.stringify(updatedCategory));

              // Also update the slug-based key
              multi.set(`category:site:${updatedCategory.siteId}:${updatedCategory.slug}`, JSON.stringify(updatedCategory));

              updatedCategories.push(updatedCategory);
            }
          }

          // Execute the transaction
          await multi.exec();

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
            categories: updatedCategories
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
