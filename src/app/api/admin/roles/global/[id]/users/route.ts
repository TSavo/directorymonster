import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantPermission } from '@/app/api/middleware/secureTenantContext';
import { ResourceType, Permission } from '@/lib/role/types';
import { RoleService } from '@/lib/role-service';

/**
 * GET handler for retrieving users with a specific global role
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

        // Ensure the role exists
        const existingRole = await RoleService.getGlobalRole(roleId);
        if (!existingRole) {
          return NextResponse.json(
            { error: 'Global role not found' },
            { status: 404 }
          );
        }

        // Get users with this role
        const users = await RoleService.getUsersWithGlobalRole(roleId);

        return NextResponse.json({ users });
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
