import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { RoleService } from '@/lib/role-service';

/**
 * GET handler for retrieving users with a specific global role
 *
 * Supports pagination with the following query parameters:
 * - page: The page number (starting from 1)
 * - pageSize: The number of items per page (maximum 100)
 *
 * @param req - The incoming Next.js request
 * @param params - The route parameters containing the role ID
 * @returns A JSON response containing the users or an error message
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  return withSecureTenantPermission(
    req,
    'role' as ResourceType,
    'read' as Permission,
    async (validatedReq, context) => {
      try {
        const roleId = params.id;
        const url = new URL(req.url);

        // Extract pagination parameters if provided
        const pageParam = url.searchParams.get('page');
        const pageSizeParam = url.searchParams.get('pageSize');

        // Parse pagination parameters
        let page: number | undefined;
        let pageSize: number | undefined;

        if (pageParam || pageSizeParam) {
          // Both parameters must be provided for pagination
          if (!pageParam || !pageSizeParam) {
            return NextResponse.json(
              { error: 'Both page and pageSize must be provided for pagination' },
              { status: 400 }
            );
          }

          // Parse and validate pagination parameters
          page = parseInt(pageParam, 10);
          pageSize = parseInt(pageSizeParam, 10);

          if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1 || pageSize > 100) {
            return NextResponse.json(
              { error: 'Invalid pagination parameters' },
              { status: 400 }
            );
          }
        }

        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }

        // Get users with this role (with or without pagination)
        const result = await RoleService.getUsersWithGlobalRole(
          roleId,
          page,
          pageSize
        );

        // Format the response based on whether pagination was used
        if (Array.isArray(result)) {
          // No pagination was used
          return NextResponse.json({ users: result });
        } else {
          // Pagination was used
          const { users, total } = result;
          const totalPages = Math.ceil(total / pageSize!);

          return NextResponse.json({
            users,
            pagination: {
              page,
              pageSize,
              total,
              totalPages
            }
          });
        }
      } catch (error) {
        console.error(`Error retrieving users with global role ${params.id}:`, error);
        return NextResponse.json(
          { error: 'Failed to get users with global role' },
          { status: 500 }
        );
      }
    },
    params.id // Pass the resource ID for specific permission check
  );
}
